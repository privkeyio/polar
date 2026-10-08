import { debug } from 'electron-log';
import { LightningNode, OpenChannelOptions } from 'shared/types';
import * as PLN from 'lib/lightning/types';
import { LightningService } from 'types';
import { waitFor } from 'utils/async';
import { httpPost } from './lampoApi';
import * as LAMPO from './types';

export class LampoService implements LightningService {
  async getInfo(node: LightningNode): Promise<PLN.LightningNodeInfo> {
    const info = await httpPost<LAMPO.GetInfoResponse>(node, 'getinfo');
    const { channels } = await httpPost<LAMPO.ChannelsResponse>(node, 'channels');
    const numActiveChannels = channels.filter(c => c.ready).length;
    return {
      pubkey: info.nodeId,
      alias: info.alias || node.name,
      rpcUrl: `${info.nodeId}@${node.name}:9735`,
      syncedToChain: !info.syncInProgress,
      blockHeight: info.blockheight,
      numActiveChannels,
      numPendingChannels: channels.length - numActiveChannels,
      numInactiveChannels: 0,
    };
  }

  async getBalances(node: LightningNode): Promise<PLN.LightningNodeBalances> {
    const { transactions } = await httpPost<LAMPO.FundsResponse>(node, 'funds');
    let [confirmed, unconfirmed] = [0, 0];
    for (const utxo of transactions) {
      if (utxo.confirmed > 0) {
        confirmed += utxo.amountMsat / 1000;
      } else {
        unconfirmed += utxo.amountMsat / 1000;
      }
    }
    const total = confirmed + unconfirmed;

    return {
      total: total.toString(),
      confirmed: confirmed.toString(),
      unconfirmed: unconfirmed.toString(),
    };
  }

  async getNewAddress(node: LightningNode): Promise<PLN.LightningNodeAddress> {
    const { address } = await httpPost<LAMPO.NewAddrResponse>(node, 'new_addr');
    return { address };
  }

  async getChannels(node: LightningNode): Promise<PLN.LightningNodeChannel[]> {
    const { channels } = await httpPost<LAMPO.ChannelsResponse>(node, 'channels');
    return channels
      .filter(c => c.isOutbound)
      .map(c => {
        const status = c.ready ? 'Open' : 'Opening';
        return {
          pending: status !== 'Open',
          uniqueId: c.channelId.slice(-12),
          channelPoint: c.fundingTxo || c.channelId,
          pubkey: c.peerId,
          capacity: c.amount.toString(),
          localBalance: this.toSats(c.availableBalanceForSendMsat),
          remoteBalance: this.toSats(c.availableBalanceForRecvMsat),
          status,
          isPrivate: !c.public,
        };
      });
  }

  async getPeers(node: LightningNode): Promise<PLN.LightningNodePeer[]> {
    const { peers } = await httpPost<LAMPO.PeersResponse>(node, 'peers');
    return peers.map(p => ({
      pubkey: p.nodeId,
      address: p.address || '',
    }));
  }

  async connectPeers(node: LightningNode, rpcUrls: string[]): Promise<void> {
    const peers = await this.getPeers(node);
    const keys = peers.map(p => p.pubkey);
    const newUrls = rpcUrls.filter(u => !keys.includes(u.split('@')[0]));
    for (const toRpcUrl of newUrls) {
      try {
        const body: LAMPO.ConnectRequest = this.parseRpcUrl(toRpcUrl);
        await httpPost<LAMPO.ConnectRequest>(node, 'connect', body);
      } catch (error: any) {
        debug(
          `Failed to connect peer '${toRpcUrl}' to Lampo node ${node.name}:`,
          error.message,
        );
      }
    }
  }

  async openChannel({
    from,
    toRpcUrl,
    amount,
    isPrivate,
  }: OpenChannelOptions): Promise<PLN.LightningNodeChannelPoint> {
    const body: LAMPO.FundChannelRequest = {
      ...this.parseRpcUrl(toRpcUrl),
      amount: parseInt(amount),
      public: !isPrivate,
    };
    const { txid } = await httpPost<LAMPO.FundChannelResponse>(from, 'fundchannel', body);
    const { channels } = await httpPost<LAMPO.ChannelsResponse>(from, 'channels');
    const channel = channels.find(
      c => c.isOutbound && c.fundingTxo?.startsWith(`${txid}:`),
    );
    const vout = channel?.fundingTxo?.split(':')[1];
    return {
      txid,
      index: vout ? parseInt(vout) : 0,
    };
  }

  async closeChannel(node: LightningNode, channelPoint: string): Promise<any> {
    const { channels } = await httpPost<LAMPO.ChannelsResponse>(node, 'channels');
    const channel = channels.find(
      c => c.fundingTxo === channelPoint || c.channelId === channelPoint,
    );
    if (!channel) throw new Error(`Channel '${channelPoint}' not found on ${node.name}`);
    const body: LAMPO.CloseRequest = {
      node_id: channel.peerId,
      channel_id: channel.channelId,
      force: false,
    };
    await httpPost(node, 'close', body);
    return true;
  }

  async createInvoice(
    node: LightningNode,
    amount: number,
    memo?: string,
    expiry?: number,
  ): Promise<string> {
    const body: LAMPO.InvoiceRequest = {
      amount_msat: amount * 1000,
      description: memo || '',
      expiring_in: expiry,
    };
    const res = await httpPost<LAMPO.InvoiceResponse>(node, 'invoice', body);
    return res.bolt11;
  }

  async payInvoice(
    node: LightningNode,
    invoice: string,
    amount?: number,
    customRecords?: PLN.CustomRecords,
  ): Promise<PLN.LightningNodePayReceipt> {
    if (customRecords && Object.keys(customRecords).length > 0) {
      throw new Error(`customRecords is not supported for ${node.implementation} nodes`);
    }
    const body: LAMPO.PayRequest = {
      invoice_str: invoice,
      amount: amount ? amount * 1000 : undefined,
    };
    const res = await httpPost<LAMPO.PayResponse>(node, 'pay', body);
    if (res.state !== 'Success') throw new Error(res.reason || res.state);

    return {
      preimage: res.paymentPreimage,
      amount: res.valueMsat / 1000,
      destination: res.path.length ? res.path[res.path.length - 1].nodeId : '',
    };
  }

  async decodeInvoice(
    node: LightningNode,
    invoice: string,
  ): Promise<PLN.LightningNodePaymentRequest> {
    const body: LAMPO.DecodeRequest = { invoice_str: invoice };
    const res = await httpPost<LAMPO.DecodeResponse>(node, 'decode', body);
    return {
      paymentHash: res.paymentHash,
      amountMsat: (res.amountMsat || 0).toString(),
      expiry: (res.expiryTime || 0).toString(),
    };
  }

  async waitUntilOnline(
    node: LightningNode,
    interval = 3 * 1000,
    timeout = 120 * 1000,
  ): Promise<void> {
    return waitFor(
      async () => {
        await this.getInfo(node);
      },
      interval,
      timeout,
    );
  }

  addListenerToNode(): Promise<void> {
    return Promise.resolve();
  }

  removeListener(): Promise<void> {
    return Promise.resolve();
  }

  subscribeChannelEvents(): Promise<void> {
    return Promise.resolve();
  }

  private toSats(msats: number): string {
    return (msats / 1000).toFixed(0).toString();
  }

  private parseRpcUrl(rpcUrl: string) {
    const [nodeId, host] = rpcUrl.split('@');
    const [addr, port] = host.split(':');
    return { node_id: nodeId, addr, port: parseInt(port) };
  }
}

export default new LampoService();

import { defaultRepoState } from 'utils/constants';
import { createLampoNetworkNode } from 'utils/network';
import { defaultStateInfo, getNetwork, testNodeDocker } from 'utils/tests';
import * as lampoApi from './lampoApi';
import { LampoService } from './lampoService';
import * as LAMPO from './types';

jest.mock('./lampoApi');

const lampoApiMock = lampoApi as jest.Mocked<typeof lampoApi>;

const channel = (values: Partial<LAMPO.Channel>): LAMPO.Channel => ({
  channelId: 'b1d0ba2c39f62ad0c1b1c7a1a5b2a6e1b6d1e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
  shortChannelId: null,
  peerId: 'peer',
  peerAlias: null,
  ready: true,
  amount: 250000,
  amountMsat: 250000000,
  public: true,
  availableBalanceForSendMsat: 240000000,
  availableBalanceForRecvMsat: 5000000,
  isOutbound: true,
  fundingTxo: 'abcd:1',
  ...values,
});

describe('LampoService', () => {
  const network = getNetwork();
  const node = createLampoNetworkNode(
    network,
    defaultRepoState.images.lampo.latest,
    undefined,
    testNodeDocker,
  );
  let lampoService: LampoService;

  beforeEach(() => {
    lampoService = new LampoService();
  });

  it('should get node info', async () => {
    const infoResponse: Partial<LAMPO.GetInfoResponse> = {
      nodeId: 'asdf',
      alias: '',
      blockheight: 10,
      syncInProgress: false,
    };
    const chanResponse: LAMPO.ChannelsResponse = {
      channels: [channel({}), channel({ ready: false }), channel({ isOutbound: false })],
    };
    lampoApiMock.httpPost
      .mockResolvedValueOnce(infoResponse)
      .mockResolvedValueOnce(chanResponse);
    const expected = defaultStateInfo({
      pubkey: 'asdf',
      alias: node.name,
      rpcUrl: `asdf@${node.name}:9735`,
      syncedToChain: true,
      blockHeight: 10,
      numActiveChannels: 2,
      numPendingChannels: 1,
    });
    const actual = await lampoService.getInfo(node);
    expect(actual).toEqual(expected);
    expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'getinfo');
  });

  it('should report not synced while the initial sync is running', async () => {
    const infoResponse: Partial<LAMPO.GetInfoResponse> = {
      nodeId: 'asdf',
      alias: 'my-alias',
      syncInProgress: true,
    };
    lampoApiMock.httpPost
      .mockResolvedValueOnce(infoResponse)
      .mockResolvedValueOnce({ channels: [] });
    const actual = await lampoService.getInfo(node);
    expect(actual.alias).toEqual('my-alias');
    expect(actual.syncedToChain).toBe(false);
  });

  it('should split confirmed and unconfirmed balances', async () => {
    const fundsResponse: LAMPO.FundsResponse = {
      transactions: [
        { txid: 'a', vout: 0, reserved: false, confirmed: 3, amountMsat: 1000000 },
        { txid: 'b', vout: 1, reserved: false, confirmed: 1, amountMsat: 2000000 },
        { txid: 'c', vout: 0, reserved: false, confirmed: 0, amountMsat: 500000 },
      ],
    };
    lampoApiMock.httpPost.mockResolvedValue(fundsResponse);
    const expected = { confirmed: '3000', unconfirmed: '500', total: '3500' };
    const actual = await lampoService.getBalances(node);
    expect(actual).toEqual(expected);
    expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'funds');
  });

  it('should get new address', async () => {
    lampoApiMock.httpPost.mockResolvedValue({ address: 'bcrt1qaddr' });
    const actual = await lampoService.getNewAddress(node);
    expect(actual).toEqual({ address: 'bcrt1qaddr' });
    expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'new_addr');
  });

  it('should only return outbound channels', async () => {
    const chanResponse: LAMPO.ChannelsResponse = {
      channels: [
        channel({ peerId: 'out' }),
        channel({ peerId: 'in', isOutbound: false, fundingTxo: 'efgh:0' }),
      ],
    };
    lampoApiMock.httpPost.mockResolvedValue(chanResponse);
    const actual = await lampoService.getChannels(node);
    expect(actual).toEqual([
      {
        pending: false,
        uniqueId: 'a1b2c3d4e5f6',
        channelPoint: 'abcd:1',
        pubkey: 'out',
        capacity: '250000',
        localBalance: '240000',
        remoteBalance: '5000',
        status: 'Open',
        isPrivate: false,
      },
    ]);
  });

  it('should fall back to the channel id before the funding outpoint is known', async () => {
    const chanResponse: LAMPO.ChannelsResponse = {
      channels: [channel({ ready: false, fundingTxo: null, public: false })],
    };
    lampoApiMock.httpPost.mockResolvedValue(chanResponse);
    const [actual] = await lampoService.getChannels(node);
    expect(actual.channelPoint).toEqual(channel({}).channelId);
    expect(actual.status).toEqual('Opening');
    expect(actual.pending).toBe(true);
    expect(actual.isPrivate).toBe(true);
  });

  it('should get peers', async () => {
    const peersResponse: LAMPO.PeersResponse = {
      peers: [
        { nodeId: 'abc', address: '172.18.0.3:9735', inbound: false },
        { nodeId: 'def', address: null, inbound: true },
      ],
    };
    lampoApiMock.httpPost.mockResolvedValue(peersResponse);
    const actual = await lampoService.getPeers(node);
    expect(actual).toEqual([
      { pubkey: 'abc', address: '172.18.0.3:9735' },
      { pubkey: 'def', address: '' },
    ]);
  });

  it('should only connect to new peers', async () => {
    lampoApiMock.httpPost
      .mockResolvedValueOnce({ peers: [{ nodeId: 'abc', address: null, inbound: true }] })
      .mockResolvedValueOnce({});
    await lampoService.connectPeers(node, ['abc@alice:9735', 'def@bob:9735']);
    expect(lampoApiMock.httpPost).toHaveBeenCalledTimes(2);
    expect(lampoApiMock.httpPost).toHaveBeenLastCalledWith(node, 'connect', {
      node_id: 'def',
      addr: 'bob',
      port: 9735,
    });
  });

  it('should not throw error when connecting to peers', async () => {
    lampoApiMock.httpPost
      .mockResolvedValueOnce({ peers: [] })
      .mockRejectedValueOnce(new Error('peer-error'));
    await expect(
      lampoService.connectPeers(node, ['def@bob:9735']),
    ).resolves.not.toThrow();
  });

  describe('openChannel', () => {
    const fundResponse: Partial<LAMPO.FundChannelResponse> = { txid: 'abcd' };

    it('should look up the funding output index', async () => {
      lampoApiMock.httpPost.mockResolvedValueOnce(fundResponse).mockResolvedValueOnce({
        channels: [
          channel({ isOutbound: false, fundingTxo: 'abcd:0' }),
          channel({ fundingTxo: 'abcdef:0' }),
          channel({ fundingTxo: 'abcd:1' }),
        ],
      });
      const actual = await lampoService.openChannel({
        from: node,
        toRpcUrl: 'def@bob:9735',
        amount: '250000',
        isPrivate: false,
      });
      expect(actual).toEqual({ txid: 'abcd', index: 1 });
      expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'fundchannel', {
        node_id: 'def',
        addr: 'bob',
        port: 9735,
        amount: 250000,
        public: true,
      });
    });

    it('should open a private channel and default the index when not found', async () => {
      lampoApiMock.httpPost
        .mockResolvedValueOnce(fundResponse)
        .mockResolvedValueOnce({ channels: [channel({ fundingTxo: null })] });
      const actual = await lampoService.openChannel({
        from: node,
        toRpcUrl: 'def@bob:9735',
        amount: '250000',
        isPrivate: true,
      });
      expect(actual).toEqual({ txid: 'abcd', index: 0 });
      expect(lampoApiMock.httpPost).toHaveBeenCalledWith(
        node,
        'fundchannel',
        expect.objectContaining({ public: false }),
      );
    });
  });

  describe('closeChannel', () => {
    it('should close a channel by its funding outpoint', async () => {
      lampoApiMock.httpPost
        .mockResolvedValueOnce({ channels: [channel({ peerId: 'def' })] })
        .mockResolvedValueOnce({});
      const actual = await lampoService.closeChannel(node, 'abcd:1');
      expect(actual).toBe(true);
      expect(lampoApiMock.httpPost).toHaveBeenLastCalledWith(node, 'close', {
        node_id: 'def',
        channel_id: channel({}).channelId,
        force: false,
      });
    });

    it('should close a channel by its channel id', async () => {
      const { channelId } = channel({});
      lampoApiMock.httpPost
        .mockResolvedValueOnce({ channels: [channel({ fundingTxo: null })] })
        .mockResolvedValueOnce({});
      await lampoService.closeChannel(node, channelId);
      expect(lampoApiMock.httpPost).toHaveBeenLastCalledWith(
        node,
        'close',
        expect.objectContaining({ channel_id: channelId }),
      );
    });

    it('should throw when the channel is not found', async () => {
      lampoApiMock.httpPost.mockResolvedValueOnce({ channels: [] });
      await expect(lampoService.closeChannel(node, 'missing:0')).rejects.toThrow(
        `Channel 'missing:0' not found on ${node.name}`,
      );
    });
  });

  it('should create an invoice', async () => {
    lampoApiMock.httpPost.mockResolvedValue({ bolt11: 'lnbcrt1invoice' });
    const actual = await lampoService.createInvoice(node, 1000);
    expect(actual).toEqual('lnbcrt1invoice');
    expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'invoice', {
      amount_msat: 1000000,
      description: '',
      expiring_in: undefined,
    });
  });

  it('should create an invoice with memo and expiry', async () => {
    lampoApiMock.httpPost.mockResolvedValue({ bolt11: 'lnbcrt1invoice' });
    await lampoService.createInvoice(node, 1000, 'test memo', 3600);
    expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'invoice', {
      amount_msat: 1000000,
      description: 'test memo',
      expiring_in: 3600,
    });
  });

  describe('payInvoice', () => {
    const payResponse: LAMPO.PayResponse = {
      path: [
        {
          nodeId: 'hop',
          shortChannelId: 1,
          hopFeeMsat: 1000,
          cltvExpiryDelta: 40,
          privateHop: false,
        },
        {
          nodeId: 'dest',
          shortChannelId: 2,
          hopFeeMsat: 123000,
          cltvExpiryDelta: 18,
          privateHop: false,
        },
      ],
      paymentHash: 'hash',
      state: 'Success',
      valueMsat: 123000,
      feeMsat: 1000,
      reason: null,
      paymentPreimage: 'preimage',
    };

    it('should pay an invoice', async () => {
      lampoApiMock.httpPost.mockResolvedValue(payResponse);
      const actual = await lampoService.payInvoice(node, 'lnbcrt1invoice');
      expect(actual).toEqual({ preimage: 'preimage', amount: 123, destination: 'dest' });
      expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'pay', {
        invoice_str: 'lnbcrt1invoice',
        amount: undefined,
      });
    });

    it('should pay an invoice with an amount', async () => {
      lampoApiMock.httpPost.mockResolvedValue({ ...payResponse, path: [] });
      const actual = await lampoService.payInvoice(node, 'lnbcrt1invoice', 123);
      expect(actual.destination).toEqual('');
      expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'pay', {
        invoice_str: 'lnbcrt1invoice',
        amount: 123000,
      });
    });

    it('should throw when the payment fails', async () => {
      lampoApiMock.httpPost.mockResolvedValue({
        ...payResponse,
        state: 'Failure',
        reason: 'RouteNotFound',
      });
      await expect(lampoService.payInvoice(node, 'lnbcrt1invoice')).rejects.toThrow(
        'RouteNotFound',
      );
    });

    it('should throw the state when no reason is given', async () => {
      lampoApiMock.httpPost.mockResolvedValue({ ...payResponse, state: 'Pending' });
      await expect(lampoService.payInvoice(node, 'lnbcrt1invoice')).rejects.toThrow(
        'Pending',
      );
    });

    it('should throw when custom records are provided', async () => {
      await expect(
        lampoService.payInvoice(node, 'lnbcrt1invoice', undefined, { 1: 'a' }),
      ).rejects.toThrow('customRecords is not supported for lampo nodes');
      expect(lampoApiMock.httpPost).not.toHaveBeenCalled();
    });
  });

  it('should decode an invoice', async () => {
    const decodeResponse: LAMPO.DecodeResponse = {
      paymentHash: 'hash',
      amountMsat: 1000000,
      expiryTime: 3600,
    };
    lampoApiMock.httpPost.mockResolvedValue(decodeResponse);
    const actual = await lampoService.decodeInvoice(node, 'lnbcrt1invoice');
    expect(actual).toEqual({
      paymentHash: 'hash',
      amountMsat: '1000000',
      expiry: '3600',
    });
    expect(lampoApiMock.httpPost).toHaveBeenCalledWith(node, 'decode', {
      invoice_str: 'lnbcrt1invoice',
    });
  });

  it('should decode an invoice without an amount', async () => {
    lampoApiMock.httpPost.mockResolvedValue({
      paymentHash: 'hash',
      amountMsat: null,
      expiryTime: null,
    });
    const actual = await lampoService.decodeInvoice(node, 'lnbcrt1invoice');
    expect(actual).toEqual({ paymentHash: 'hash', amountMsat: '0', expiry: '0' });
  });

  it('should resolve the listener functions', async () => {
    await expect(lampoService.addListenerToNode()).resolves.toBeUndefined();
    await expect(lampoService.removeListener()).resolves.toBeUndefined();
    await expect(lampoService.subscribeChannelEvents()).resolves.toBeUndefined();
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      lampoApiMock.httpPost
        .mockResolvedValueOnce({ nodeId: 'asdf' })
        .mockResolvedValueOnce({ channels: [] });
      await expect(lampoService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(lampoApiMock.httpPost).toHaveBeenCalledTimes(2);
    });

    it('should throw error if waiting fails', async () => {
      lampoApiMock.httpPost.mockRejectedValue(new Error('test-error'));
      await expect(lampoService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
    });
  });
});

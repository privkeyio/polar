import { debug } from 'electron-log';
import {
  defaultLndChannel,
  defaultLndInfo,
  defaultLndListChannels,
  defaultLndPendingChannel,
  defaultLndPendingChannels,
  defaultLndPendingOpenChannel,
  defaultLndWaitingCloseChannel,
  defaultLndWalletBalance,
} from 'shared';
import { defaultStateBalances, defaultStateInfo, getNetwork } from 'utils/tests';
import lndProxyClient from './lndProxyClient';
import lndService from './lndService';

jest.mock('electron-log');
jest.mock('./lndProxyClient');

describe('LndService', () => {
  const node = getNetwork().nodes.lightning[0];

  it('should get node info', async () => {
    const apiResponse = defaultLndInfo({ identityPubkey: 'asdf' });
    const expected = defaultStateInfo({ pubkey: 'asdf' });
    lndProxyClient.getInfo = jest.fn().mockResolvedValue(apiResponse);
    const actual = await lndService.getInfo(node);
    expect(actual).toEqual(expected);
  });

  it('should get wallet balance', async () => {
    const apiResponse = defaultLndWalletBalance({ confirmedBalance: '1000' });
    const expected = defaultStateBalances({ confirmed: '1000' });
    lndProxyClient.getWalletBalance = jest.fn().mockResolvedValue(apiResponse);
    const actual = await lndService.getBalances(node);
    expect(actual).toEqual(expected);
  });

  it('should get new address', async () => {
    const expected = { address: 'abcdef' };
    lndProxyClient.getNewAddress = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.getNewAddress(node);
    expect(actual).toEqual(expected);
  });

  it('should get list of channels', async () => {
    const mocked = defaultLndListChannels({
      channels: [
        defaultLndChannel({
          remotePubkey: 'xyz',
          initiator: true,
          customChannelData: Buffer.from('random data'),
        }),
      ],
    });
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    lndProxyClient.listChannels = jest.fn().mockResolvedValue(mocked);
    lndProxyClient.pendingChannels = jest
      .fn()
      .mockResolvedValue(defaultLndPendingChannels({}));
    const actual = await lndService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should get list of pending channels', async () => {
    const mocked = defaultLndPendingChannels({
      pendingOpenChannels: [
        defaultLndPendingOpenChannel({
          channel: defaultLndPendingChannel({ remoteNodePub: 'xyz' }),
        }),
      ],
    });
    const expected = [expect.objectContaining({ pubkey: 'xyz' })];
    lndProxyClient.listChannels = jest.fn().mockResolvedValue(defaultLndListChannels({}));
    lndProxyClient.pendingChannels = jest.fn().mockResolvedValue(mocked);
    const actual = await lndService.getChannels(node);
    expect(actual).toEqual(expected);
  });

  it('should not throw error when connecting to peers', async () => {
    lndProxyClient.listPeers = jest.fn().mockResolvedValue({
      peers: [{ pubKey: 'fdsa' }],
    });
    lndProxyClient.connectPeer = jest.fn().mockRejectedValue(new Error('peer-error'));
    await expect(lndService.connectPeers(node, ['asdf'])).resolves.not.toThrow();
  });

  it('should close the channel', async () => {
    const expected = true;
    lndProxyClient.closeChannel = jest.fn().mockResolvedValue(expected);
    const actual = await lndService.closeChannel(node, 'chanPoint');
    expect(actual).toEqual(expected);
  });

  it('should create an invoice', async () => {
    const expected = 'lnbc1invoice';
    const mocked = { paymentRequest: expected };
    lndProxyClient.createInvoice = jest.fn().mockResolvedValue(mocked);
    const actual = await lndService.createInvoice(node, 1000);
    expect(actual).toEqual(expected);
    expect(lndProxyClient.createInvoice).toHaveBeenCalledWith(
      node,
      expect.objectContaining({
        value: '1000',
        memo: undefined,
        expiry: undefined,
        private: true,
      }),
    );
  });

  it('should create an invoice with memo and expiry', async () => {
    const expected = 'lnbc1invoice';
    const mocked = { paymentRequest: expected };
    lndProxyClient.createInvoice = jest.fn().mockResolvedValue(mocked);
    const actual = await lndService.createInvoice(node, 1000, 'test memo', 3600);
    expect(actual).toEqual(expected);
    expect(lndProxyClient.createInvoice).toHaveBeenCalledWith(
      node,
      expect.objectContaining({
        value: '1000',
        memo: 'test memo',
        expiry: '3600',
        private: true,
      }),
    );
  });

  it('should pay an invoice', async () => {
    const payResponse = { paymentPreimage: 'preimage' };
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '1000',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.payInvoice(node, 'lnbc1invoice');
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(1000);
    expect(actual.destination).toEqual('asdf');
  });

  it('should pay an invoice with an amount', async () => {
    const payResponse = { paymentPreimage: 'preimage' };
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '10000',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.payInvoice(node, 'lnbc1invoice', 10000);
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(10000);
    expect(actual.destination).toEqual('asdf');
  });

  it('should pay invoice with amount for a payreq without one', async () => {
    const payResponse = { paymentPreimage: 'preimage' };
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '0',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockResolvedValue(payResponse);
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.payInvoice(node, 'lnbc1invoice', 10000);
    expect(actual.preimage).toEqual('preimage');
    expect(actual.amount).toEqual(0);
    expect(actual.destination).toEqual('asdf');
    expect(lndProxyClient.payInvoice).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ amt: '10000' }),
    );
  });

  it('should throw an error if paying the invoice fails', async () => {
    const decodeResponse = {
      paymentPreimage: 'preimage',
      numSatoshis: '1000',
      destination: 'asdf',
    };
    lndProxyClient.payInvoice = jest.fn().mockRejectedValue(new Error('pay-err'));
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    await expect(lndService.payInvoice(node, 'lnbc1invoice')).rejects.toThrow('pay-err');
  });

  it('should decode an invoice', async () => {
    const decodeResponse = {
      paymentHash: '129aff5e8f8de157a34ab3b36f1ed745f31998e4f9e709f3d32f6ebde78c7c10',
      expiry: '86400',
      numMsat: '2500000',
    };
    lndProxyClient.decodeInvoice = jest.fn().mockResolvedValue(decodeResponse);
    const actual = await lndService.decodeInvoice(node, 'lnbc1invoice');
    expect(actual.paymentHash).toEqual(decodeResponse.paymentHash);
    expect(actual.amountMsat).toEqual(decodeResponse.numMsat);
    expect(actual.expiry).toEqual(decodeResponse.expiry);
  });

  it('should throw an error for an incorrect node', async () => {
    const cln = getNetwork().nodes.lightning[1];
    await expect(lndService.getInfo(cln)).rejects.toThrow(
      "LndService cannot be used for 'c-lightning' nodes",
    );
  });

  describe('openChannel', () => {
    it('should open the channel successfully', async () => {
      lndProxyClient.getInfo = jest
        .fn()
        .mockResolvedValue(defaultLndInfo({ identityPubkey: 'asdf' }));
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'asdf' }],
      });
      const expected = { txid: 'xyz', index: 0 };
      const mocked = { fundingTxidStr: 'xyz', outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
      expect(lndProxyClient.listPeers).toHaveBeenCalledTimes(1);
      expect(lndProxyClient.connectPeer).toHaveBeenCalledTimes(0);
    });

    it('should connect peer then open the channel', async () => {
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({ pubkey: 'asdf' });
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'fdsa' }],
      });
      const expected = { txid: 'xyz', index: 0 };
      const mocked = { fundingTxidStr: 'xyz', outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
      expect(lndProxyClient.listPeers).toHaveBeenCalledTimes(1);
      expect(lndProxyClient.connectPeer).toHaveBeenCalledTimes(1);
    });

    it('should open channel with fundingTxidBytes', async () => {
      lndProxyClient.getInfo = jest
        .fn()
        .mockResolvedValue(defaultLndInfo({ identityPubkey: 'asdf' }));
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'asdf' }],
      });
      // Create a mock txid bytes (little-endian representation - LND returns them this way)
      const txidBytes = Buffer.from('cdab3412', 'hex'); // little-endian
      const expectedTxid = '1234abcd'; // big-endian (after reverse)
      const expected = { txid: expectedTxid, index: 0 };
      const mocked = { fundingTxidBytes: txidBytes, outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
    });

    it('should open channel with no txid', async () => {
      lndProxyClient.getInfo = jest
        .fn()
        .mockResolvedValue(defaultLndInfo({ identityPubkey: 'asdf' }));
      lndProxyClient.listPeers = jest.fn().mockResolvedValue({
        peers: [{ pubKey: 'asdf' }],
      });
      const expected = { txid: '', index: 0 };
      const mocked = { outputIndex: 0 };
      lndProxyClient.openChannel = jest.fn().mockResolvedValue(mocked);
      const actual = await lndService.openChannel({
        from: node,
        toRpcUrl: 'asdf@1.1.1.1:9735',
        amount: '1000',
        isPrivate: false,
      });
      expect(actual).toEqual(expected);
    });
  });

  describe('waitUntilOnline', () => {
    it('should wait successfully', async () => {
      lndProxyClient.getState = jest.fn().mockResolvedValue({ state: 'SERVER_ACTIVE' });
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({});
      await expect(lndService.waitUntilOnline(node)).resolves.not.toThrow();
      expect(lndProxyClient.getInfo).toHaveBeenCalledTimes(1);
    });

    it('should throw error if waiting fails', async () => {
      lndProxyClient.getState = jest.fn().mockResolvedValue({ state: 'SERVER_ACTIVE' });
      lndProxyClient.getInfo = jest.fn().mockRejectedValue(new Error('test-error'));
      await expect(lndService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'test-error',
      );
      expect(lndProxyClient.getInfo).toHaveBeenCalledTimes(4);
    });

    it('should abort immediately when wallet is LOCKED', async () => {
      lndProxyClient.getState = jest.fn().mockResolvedValue({ state: 'LOCKED' });
      await expect(lndService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'wallet-locked',
      );
      expect(lndProxyClient.getInfo).not.toHaveBeenCalled();
    });

    it('should not abort on a single transient NON_EXISTING read', async () => {
      // a --noseedbackup node briefly reports NON_EXISTING before it
      // auto-creates its wallet; a lone read shouldn't be mistaken for a
      // wallet that needs to be initialized
      lndProxyClient.getState = jest
        .fn()
        .mockResolvedValueOnce({ state: 'NON_EXISTING' })
        .mockResolvedValue({ state: 'SERVER_ACTIVE' });
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({});
      await expect(lndService.waitUntilOnline(node, 0.5, 10)).resolves.not.toThrow();
    });

    it('should keep waiting while the node is only RPC_ACTIVE', async () => {
      // peers can't connect until the main server has started
      lndProxyClient.getState = jest.fn().mockResolvedValue({ state: 'RPC_ACTIVE' });
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({});
      await expect(lndService.waitUntilOnline(node, 0.5, 1)).rejects.toThrow(
        'waiting for SERVER_ACTIVE, current state: RPC_ACTIVE',
      );
      expect(lndProxyClient.getInfo).not.toHaveBeenCalled();
    });

    it('should abort once NON_EXISTING is read twice in a row', async () => {
      lndProxyClient.getState = jest.fn().mockResolvedValue({ state: 'NON_EXISTING' });
      await expect(lndService.waitUntilOnline(node, 0.5, 10)).rejects.toThrow(
        'wallet-not-initialized',
      );
      expect(lndProxyClient.getInfo).not.toHaveBeenCalled();
    });

    it('should keep retrying while state is not yet SERVER_ACTIVE', async () => {
      lndProxyClient.getState = jest
        .fn()
        .mockResolvedValueOnce({ state: 'WAITING_TO_START' })
        .mockResolvedValueOnce({ state: 'RPC_ACTIVE' })
        .mockResolvedValue({ state: 'SERVER_ACTIVE' });
      lndProxyClient.getInfo = jest.fn().mockResolvedValue({});
      await expect(lndService.waitUntilOnline(node, 0.5, 10)).resolves.not.toThrow();
      expect(lndProxyClient.getState).toHaveBeenCalledTimes(3);
    });
  });

  describe('wallet RPCs', () => {
    it('should return seed mnemonic', async () => {
      const mnemonic = ['word1', 'word2', 'word3'];
      lndProxyClient.genSeed = jest
        .fn()
        .mockResolvedValue({ cipherSeedMnemonic: mnemonic });
      const result = await lndService.genSeed(node);
      expect(result).toEqual(mnemonic);
    });

    it('should return admin macaroon from initWallet', async () => {
      const macaroon = Buffer.from('deadbeef', 'hex');
      lndProxyClient.initWallet = jest
        .fn()
        .mockResolvedValue({ adminMacaroon: macaroon });
      const result = await lndService.initWallet(node, 'password', ['word1', 'word2']);
      expect(result).toEqual(macaroon);
      // an exact match proves no backup or recovery window is sent for a new wallet
      expect(lndProxyClient.initWallet).toHaveBeenCalledWith(expect.anything(), {
        walletPassword: Buffer.from('password', 'utf-8'),
        cipherSeedMnemonic: ['word1', 'word2'],
      });
    });

    it('should submit the channel backup and recovery window with the seed', async () => {
      const backup = Buffer.from([0x00, 0xff, 0x80]);
      lndProxyClient.initWallet = jest.fn().mockResolvedValue({ adminMacaroon: '' });
      await lndService.initWallet(node, 'password', ['word1'], {
        channelBackup: backup,
        recoveryWindow: 2500,
      });
      expect(lndProxyClient.initWallet).toHaveBeenCalledWith(expect.anything(), {
        walletPassword: Buffer.from('password', 'utf-8'),
        cipherSeedMnemonic: ['word1'],
        recoveryWindow: 2500,
        channelBackups: { multiChanBackup: { multiChanBackup: backup } },
      });
    });

    it('should keep an explicit zero recovery window and omit an absent backup', async () => {
      lndProxyClient.initWallet = jest.fn().mockResolvedValue({ adminMacaroon: '' });
      await lndService.initWallet(node, 'password', ['word1'], { recoveryWindow: 0 });
      const req = (lndProxyClient.initWallet as jest.Mock).mock.calls[0][1];
      expect(req.recoveryWindow).toBe(0);
      expect(req.channelBackups).toBeUndefined();
    });

    describe('getRecoveredChannelPoints', () => {
      const mockPending = (value: any) => {
        lndProxyClient.pendingChannels = jest
          .fn()
          .mockResolvedValue(defaultLndPendingChannels(value));
      };

      it('should return the outpoints of the channels waiting to close', async () => {
        mockPending({
          waitingCloseChannels: [
            defaultLndWaitingCloseChannel({
              channel: defaultLndPendingChannel({ channelPoint: 'txid1:0' }),
            }),
            defaultLndWaitingCloseChannel({
              channel: defaultLndPendingChannel({ channelPoint: 'txid2:1' }),
            }),
          ],
        });
        await expect(lndService.getRecoveredChannelPoints(node)).resolves.toEqual([
          'txid1:0',
          'txid2:1',
        ]);
      });

      it('should not require a closing txid to report a channel', async () => {
        // the closing txid is unknown until it confirms
        mockPending({
          waitingCloseChannels: [
            defaultLndWaitingCloseChannel({
              channel: defaultLndPendingChannel({ channelPoint: 'txid1:0' }),
              closingTxid: '',
            }),
          ],
        });
        await expect(lndService.getRecoveredChannelPoints(node)).resolves.toEqual([
          'txid1:0',
        ]);
      });

      it('should skip an entry with no channel details', async () => {
        mockPending({ waitingCloseChannels: [defaultLndWaitingCloseChannel({})] });
        await expect(lndService.getRecoveredChannelPoints(node)).resolves.toEqual([]);
      });

      it('should return an empty list when no channels are closing', async () => {
        mockPending({});
        await expect(lndService.getRecoveredChannelPoints(node)).resolves.toEqual([]);
      });
    });

    it('should call unlockWallet with password', async () => {
      lndProxyClient.unlockWallet = jest.fn().mockResolvedValue({});
      await expect(lndService.unlockWallet(node, 'password')).resolves.not.toThrow();
      expect(lndProxyClient.unlockWallet).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ walletPassword: Buffer.from('password', 'utf-8') }),
      );
    });
  });

  it('should subscribe Channel Events', async () => {
    const mockCallback = jest.fn();
    const pendingChannelEvent = { pendingOpenChannel: { txid: 'txid' } };
    const openChannelEvent = { activeChannel: { fundingTxidBytes: 'txid' } };
    const inActiveChannelEvent = { inactiveChannel: { fundingTxidBytes: 'txid' } };
    const closedChannelEvent = { closedChannel: { closingTxHash: 'txhash' } };
    const unknownChannelEvent = { unknownChannel: { txid: 'txid' } };

    lndProxyClient.subscribeChannelEvents = jest.fn().mockImplementation((_, cb) => {
      cb(pendingChannelEvent);
      cb(openChannelEvent);
      cb(inActiveChannelEvent);
      cb(closedChannelEvent);
      cb(unknownChannelEvent);
    });

    await lndService.subscribeChannelEvents(node, mockCallback);

    expect(lndProxyClient.subscribeChannelEvents).toHaveBeenCalledWith(
      node,
      expect.any(Function),
    );

    expect(mockCallback).toHaveBeenCalledWith({ type: 'Pending' });
    expect(mockCallback).toHaveBeenCalledWith({ type: 'Open' });
    expect(mockCallback).toHaveBeenCalledWith({ type: 'Closed' });
  });

  it('addListenerToNode should call debug with node port', async () => {
    await lndService.addListenerToNode(node);
    expect(debug).toHaveBeenCalledWith(
      'addListenerToNode LndNode on port: ',
      node.ports.rest,
    );
  });

  it('removeListener should call debug with node port', async () => {
    await lndService.removeListener(node);
    expect(debug).toHaveBeenCalledWith(
      'LndService: removeListener',
      node.name,
      node.ports.rest,
    );
  });
});

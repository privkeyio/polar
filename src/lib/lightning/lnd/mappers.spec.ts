import { defaultLndChannel, defaultLndPendingChannel } from 'shared';
import { mapOpenChannel, mapPendingChannel } from './mappers';

jest.mock('electron-log');

describe('LndMappers', () => {
  const txid = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  const pubkey = '02a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

  describe('mapOpenChannel', () => {
    it('should map properties correctly', () => {
      const lndChannel = defaultLndChannel({
        channelPoint: `${txid}:0`,
        remotePubkey: pubkey,
        capacity: '1000',
        localBalance: '500',
        remoteBalance: '500',
        private: true,
      });

      const result = mapOpenChannel(lndChannel);

      expect(result).toEqual(
        expect.objectContaining({
          pending: false,
          uniqueId: `${txid}-0`,
          channelPoint: `${txid}:0`,
          pubkey,
          capacity: '1000',
          localBalance: '500',
          remoteBalance: '500',
          status: 'Open',
          isPrivate: true,
        }),
      );
    });

    it('should produce unique IDs for batch-opened channels with same txid', () => {
      const chan0 = defaultLndChannel({ channelPoint: `${txid}:0` });
      const chan1 = defaultLndChannel({ channelPoint: `${txid}:1` });

      expect(mapOpenChannel(chan0).uniqueId).not.toBe(mapOpenChannel(chan1).uniqueId);
    });
  });

  describe('mapPendingChannel', () => {
    it('should map properties correctly', () => {
      const lndChannel = defaultLndPendingChannel({
        channelPoint: `${txid}:0`,
        remoteNodePub: pubkey,
        capacity: '1000',
        localBalance: '500',
        remoteBalance: '500',
      });

      const result = mapPendingChannel('Opening')(lndChannel);

      expect(result).toEqual(
        expect.objectContaining({
          pending: true,
          uniqueId: `${txid}-0`,
          channelPoint: `${txid}:0`,
          pubkey,
          capacity: '1000',
          localBalance: '500',
          remoteBalance: '500',
          status: 'Opening',
          isPrivate: false,
        }),
      );
    });

    it('should produce unique IDs for batch-opened channels with same txid', () => {
      const chan0 = defaultLndPendingChannel({ channelPoint: `${txid}:0` });
      const chan1 = defaultLndPendingChannel({ channelPoint: `${txid}:1` });

      const res0 = mapPendingChannel('Opening')(chan0);
      const res1 = mapPendingChannel('Opening')(chan1);

      expect(res0.uniqueId).not.toBe(res1.uniqueId);
    });
  });
});

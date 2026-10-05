import * as LND from '@lightningpolar/lnd-api';
import { PendingChannel } from 'shared/lndDefaults';
import { LightningNodeChannel } from 'lib/lightning/types';

export const mapOpenChannel = (chan: LND.Channel): LightningNodeChannel => {
  return {
    pending: false,
    uniqueId: chan.channelPoint.replace(':', '-'),
    channelPoint: chan.channelPoint,
    pubkey: chan.remotePubkey,
    capacity: chan.capacity,
    localBalance: chan.localBalance,
    remoteBalance: chan.remoteBalance,
    status: 'Open',
    isPrivate: chan.private,
  };
};

export const mapPendingChannel =
  (status: LightningNodeChannel['status']) =>
  (chan: PendingChannel): LightningNodeChannel => ({
    pending: true,
    uniqueId: chan.channelPoint.replace(':', '-'),
    channelPoint: chan.channelPoint,
    pubkey: chan.remoteNodePub,
    capacity: chan.capacity,
    localBalance: chan.localBalance,
    remoteBalance: chan.remoteBalance,
    status,
    isPrivate: false,
  });

import { getNetwork } from 'utils/tests';
import { BitcoinFactory } from './';
import { bitcoindService } from './bitcoind';
import notImplementedService from './notImplementedService';

describe('BitcoinFactory', () => {
  const network = getNetwork();
  const factory = new BitcoinFactory();

  it('should return the bitcoind service', () => {
    const node = network.nodes.bitcoin[0];
    expect(factory.getService(node)).toBe(bitcoindService);
  });

  it('should return the not implemented service for btcd', () => {
    const node = { ...network.nodes.bitcoin[0], implementation: 'btcd' as const };
    expect(factory.getService(node)).toBe(notImplementedService);
  });
});

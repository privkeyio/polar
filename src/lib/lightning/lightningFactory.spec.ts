import { defaultLndInfo } from 'shared';
import { getNetwork } from 'utils/tests';
import { LightningFactory } from './';
import * as clightningApi from './clightning/clightningApi';
import * as lampoApi from './lampo/lampoApi';
import lndProxyClient from './lnd/lndProxyClient';

jest.mock('./lnd/lndProxyClient');
jest.mock('./clightning/clightningApi');
jest.mock('./lampo/lampoApi');

const clightningApiMock = clightningApi as jest.Mocked<typeof clightningApi>;
const lampoApiMock = lampoApi as jest.Mocked<typeof lampoApi>;

describe('LightningFactory', () => {
  const network = getNetwork();
  const factory = new LightningFactory();

  it('should return a working LND service', async () => {
    const apiResponse = defaultLndInfo({ identityPubkey: 'asdf' });
    lndProxyClient.getInfo = jest.fn().mockResolvedValue(apiResponse);
    const node = network.nodes.lightning[0];
    const service = factory.getService(node);
    await service.getInfo(node);
    expect(lndProxyClient.getInfo).toBeCalledTimes(1);
  });

  it('should return a working c-lightning service', async () => {
    clightningApiMock.httpPost.mockResolvedValue({
      id: 'asdf',
      binding: [],
    });
    const node = network.nodes.lightning[1];
    const service = factory.getService(node);
    await service.getInfo(node);
    expect(clightningApiMock.httpPost).toBeCalledTimes(1);
  });

  it('should return a working lampo service', async () => {
    lampoApiMock.httpPost
      .mockResolvedValueOnce({ nodeId: 'asdf' })
      .mockResolvedValueOnce({ channels: [] });
    const node = { ...network.nodes.lightning[1], implementation: 'lampo' } as any;
    const service = factory.getService(node);
    await service.getInfo(node);
    expect(lampoApiMock.httpPost).toBeCalledWith(node, 'getinfo');
  });
});

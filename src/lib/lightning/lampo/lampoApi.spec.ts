import * as utils from 'shared/utils';
import { defaultRepoState } from 'utils/constants';
import { createLampoNetworkNode } from 'utils/network';
import { getNetwork, testNodeDocker } from 'utils/tests';
import { httpPost } from './lampoApi';

jest.mock('shared/utils');

const utilsMock = utils as jest.Mocked<typeof utils>;

describe('LampoApi', () => {
  const node = createLampoNetworkNode(
    getNetwork(),
    defaultRepoState.images.lampo.latest,
    undefined,
    testNodeDocker,
  );

  it('should perform a successful httpPost', async () => {
    let url = '';
    let options: utils.HttpRequestOptions = {};
    utilsMock.httpRequest.mockImplementation((u, o) => {
      url = u;
      options = o as utils.HttpRequestOptions;
      return Promise.resolve('{ "node_id": "abc", "sync_in_progress": false }');
    });

    const res = await httpPost(node, 'connect', { node_id: 'abc', port: 9735 });
    expect(res).toEqual({ nodeId: 'abc', syncInProgress: false });
    expect(url).toEqual(`http://127.0.0.1:${node.ports.rest}/connect`);
    expect(options).toEqual({
      body: '{"node_id":"abc","port":9735}',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  });

  it('should send an empty object when there is no body', async () => {
    let options: utils.HttpRequestOptions = {};
    utilsMock.httpRequest.mockImplementation((u, o) => {
      options = o as utils.HttpRequestOptions;
      return Promise.resolve('{ "address": "bcrt1q" }');
    });

    const res = await httpPost(node, 'new_addr');
    expect(res).toEqual({ address: 'bcrt1q' });
    expect(options.body).toEqual('{}');
  });

  it('should throw an error for an error response', async () => {
    utilsMock.httpRequest.mockResolvedValue(
      '{ "code": -1, "message": "peer is not connected", "data": null }',
    );
    await expect(httpPost(node, 'close')).rejects.toThrow('peer is not connected');
  });

  it('should not treat a response with a message but no code as an error', async () => {
    utilsMock.httpRequest.mockResolvedValue('{ "message": "closing", "peer_id": "abc" }');
    await expect(httpPost(node, 'close')).resolves.toEqual({
      message: 'closing',
      peerId: 'abc',
    });
  });

  it('should throw an error for an incorrect node implementation', async () => {
    const lnd = getNetwork().nodes.lightning[0];
    await expect(httpPost(lnd, 'getinfo')).rejects.toThrow(
      "LampoService cannot be used for 'LND' nodes",
    );
  });
});

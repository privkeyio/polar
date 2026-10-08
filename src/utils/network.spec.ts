import detectPort from 'detect-port';
import {
  BitcoinNode,
  CLightningNode,
  LampoNode,
  LightningNode,
  LndNode,
  NodeImplementation,
  Status,
} from 'shared/types';
import { Network } from 'types';
import { defaultRepoState } from './constants';
import {
  createNetwork,
  getCLightningFilePaths,
  getImageCommand,
  getInvoicePayload,
  getLndFilePaths,
  getOpenPortRange,
  getOpenPorts,
  isNodeRunning,
  OpenPorts,
  renameNode,
} from './network';
import { testManagedImages } from './tests';

const mockDetectPort = detectPort as jest.Mock;

describe('Network Utils', () => {
  describe('getInvoicePayload', () => {
    const localNode: LightningNode = {
      id: 1,
      networkId: 1,
      name: 'Local Node',
      type: 'lightning',
      version: 'v0.1.0',
      docker: {
        image: 'lightning-node-image',
        command: 'start-node',
      },
      implementation: 'LND',
      backendName: 'Bitcoin Core',
      ports: {
        grpc: 10009,
        rest: 8080,
      },
      status: Status.Started,
    };

    const remoteNode: LightningNode = {
      id: 2,
      networkId: 1,
      name: 'Remote Node',
      type: 'lightning',
      version: 'v0.1.0',
      status: Status.Started,
      docker: {
        image: 'lightning-node-image',
        command: 'start-node',
      },
      implementation: 'LND',
      backendName: 'Bitcoin Core',
      ports: {
        grpc: 10010,
        rest: 8081,
      },
    };

    it('should return correct payload when local balance is greater than remote balance', () => {
      const channel = {
        pending: false,
        uniqueId: 'channel1',
        channelPoint: 'point1',
        pubkey: 'pubkey1',
        capacity: '1000',
        localBalance: '1000',
        remoteBalance: '500',
        status: 'Open' as const,
        isPrivate: false,
      };
      const nextLocalBalance = 800;
      const payload = getInvoicePayload(channel, localNode, remoteNode, nextLocalBalance);

      expect(payload.source).toBe(localNode);
      expect(payload.target).toBe(remoteNode);
      expect(payload.amount).toBe(200);
    });

    it('should return correct payload when local balance is less than next local balance', () => {
      const channel = {
        pending: false,
        uniqueId: 'channel2',
        channelPoint: 'point2',
        pubkey: 'pubkey2',
        capacity: '1000',
        localBalance: '800',
        remoteBalance: '1000',
        status: 'Open' as const,
        isPrivate: false,
      };

      const nextLocalBalance = 1000;
      const payload = getInvoicePayload(channel, localNode, remoteNode, nextLocalBalance);

      expect(payload.source).toBe(remoteNode);
      expect(payload.target).toBe(localNode);
      expect(payload.amount).toBe(200);
    });
  });

  describe('getImageCommand', () => {
    it('should return the commands for managed images', () => {
      // create images with the commands set to their implementation
      const images = testManagedImages.map(i => ({ ...i, command: i.implementation }));
      const impls: NodeImplementation[] = ['LND', 'c-lightning', 'bitcoind'];
      impls.forEach(impl => {
        expect(getImageCommand(images, impl, defaultRepoState.images[impl].latest)).toBe(
          impl,
        );
      });
    });

    it('should thrown an error if the image was not found', () => {
      expect(() => getImageCommand(testManagedImages, 'LND', 'invalid')).toThrow();
    });
  });

  describe('getOpenPortRange', () => {
    beforeEach(() => {
      let port = 10003;
      mockDetectPort.mockImplementation(() => Promise.resolve(port++));
    });

    it('should return valid open ports', async () => {
      const ports = await getOpenPortRange([10001, 10002, 10003]);
      expect(ports).toEqual([10003, 10004, 10005]);
    });
  });

  describe('getOpenPorts', () => {
    let network: Network;

    beforeEach(() => {
      network = createNetwork({
        id: 1,
        name: 'my-test',
        description: 'my-test-description',
        lndNodes: 4,
        clightningNodes: 1,
        lampoNodes: 0,
        bitcoindNodes: 1,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
    });

    it('should update the ports for bitcoind', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning = [];
      const restPort = network.nodes.bitcoin[0].ports.rpc;
      const p2pPort = network.nodes.bitcoin[0].ports.p2p;
      const zmqBlockPort = network.nodes.bitcoin[0].ports.zmqBlock;
      const zmqTxPort = network.nodes.bitcoin[0].ports.zmqTx;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rpc).toBe(restPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].p2p).toBe(p2pPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBe(zmqBlockPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBe(zmqTxPort + 1);
    });

    it('should update the rest port for bitcoind', async () => {
      const portsInUse = [18443];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const restPort = network.nodes.bitcoin[0].ports.rpc;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rpc).toBe(restPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the p2p port for bitcoind', async () => {
      const portsInUse = [19444];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const p2pPort = network.nodes.bitcoin[0].ports.p2p;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].p2p).toBe(p2pPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the zmq block port for bitcoind', async () => {
      const portsInUse = [28334];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const zmqBlockPort = network.nodes.bitcoin[0].ports.zmqBlock;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rest).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBe(zmqBlockPort + 1);
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBeUndefined();
    });

    it('should update the zmq tx port for bitcoind', async () => {
      const portsInUse = [29335];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.lightning = [];
      const zmqTxPort = network.nodes.bitcoin[0].ports.zmqTx;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.bitcoin[0].name].rest).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqBlock).toBeUndefined();
      expect(ports[network.nodes.bitcoin[0].name].zmqTx).toBe(zmqTxPort + 1);
    });

    it('should update the grpc ports for lightning nodes', async () => {
      const portsInUse = [10001];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].grpc).toBe(10002);
      expect(ports[network.nodes.lightning[4].name].grpc).toBe(10005);
    });

    it("should not update zero'd grpc port for c-lightning nodes", async () => {
      const portsInUse = [8182, 10001];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      // set port to 0, mimicking an old c-lightning node
      (network.nodes.lightning[1] as CLightningNode).ports.grpc = 0;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[1].name].rest).toBe(8183);
      expect(ports[network.nodes.lightning[1].name].grpc).toBeUndefined();
    });

    it('should update the rest ports for lightning nodes', async () => {
      const portsInUse = [8081];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].rest).toBe(8082);
      expect(ports[network.nodes.lightning[4].name].rest).toBe(8085);
    });

    it('should update the p2p ports for lightning nodes', async () => {
      const portsInUse = [9735, 9836, 9737];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[network.nodes.lightning[0].name].p2p).toBe(9736);
      expect(ports[network.nodes.lightning[1].name].p2p).toBe(9837);
      expect(ports[network.nodes.lightning[4].name].p2p).toBe(9740);
    });

    it('should update the rest and p2p ports for lampo nodes', async () => {
      network = createNetwork({
        id: 1,
        name: 'my-test',
        description: 'my-test-description',
        lndNodes: 0,
        clightningNodes: 0,
        lampoNodes: 2,
        bitcoindNodes: 1,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
      const portsInUse = [8281, 9936];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const [alice, bob] = network.nodes.lightning as LampoNode[];
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      expect(ports[alice.name].rest).toBe(8282);
      expect(ports[alice.name].p2p).toBe(9935);
      expect(ports[bob.name].rest).toBe(8283);
      expect(ports[bob.name].p2p).toBe(9937);
    });

    it('should not update ports if none are in use', async () => {
      const portsInUse: number[] = [];
      mockDetectPort.mockImplementation(port =>
        Promise.resolve(portsInUse.includes(port) ? port + 1 : port),
      );
      network.nodes.bitcoin = [];
      const ports = await getOpenPorts(network);
      expect(ports).toBeUndefined();
    });

    it('should not update ports for started nodes', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning[0].status = Status.Started;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      // alice ports should not be changed
      expect(ports[network.nodes.lightning[0].name]).toBeUndefined();
      // bob ports should change
      const lnd2 = network.nodes.lightning[2] as LndNode;
      expect(ports[lnd2.name].grpc).toBe(lnd2.ports.grpc + 1);
      expect(ports[lnd2.name].rest).toBe(lnd2.ports.rest + 1);
    });

    it('should not update ports for locked nodes', async () => {
      mockDetectPort.mockImplementation(port => Promise.resolve(port + 1));
      network.nodes.lightning[0].status = Status.Locked;
      const ports = (await getOpenPorts(network)) as OpenPorts;
      expect(ports).toBeDefined();
      // a locked node is still holding its ports, so they should not be changed
      expect(ports[network.nodes.lightning[0].name]).toBeUndefined();
      // bob ports should change
      const lnd2 = network.nodes.lightning[2] as LndNode;
      expect(ports[lnd2.name].grpc).toBe(lnd2.ports.grpc + 1);
      expect(ports[lnd2.name].rest).toBe(lnd2.ports.rest + 1);
    });
  });

  describe('isNodeRunning', () => {
    it('should return true for Started and Locked', () => {
      expect(isNodeRunning(Status.Started)).toBe(true);
      expect(isNodeRunning(Status.Locked)).toBe(true);
    });

    it('should return false for all other statuses', () => {
      expect(isNodeRunning(Status.Stopped)).toBe(false);
      expect(isNodeRunning(Status.Starting)).toBe(false);
      expect(isNodeRunning(Status.Stopping)).toBe(false);
      expect(isNodeRunning(Status.Error)).toBe(false);
    });
  });

  describe('renameNode', () => {
    let network: Network;

    beforeEach(() => {
      network = createNetwork({
        id: 1,
        name: 'my-test',
        description: 'my-test-description',
        lndNodes: 2,
        clightningNodes: 1,
        lampoNodes: 1,
        bitcoindNodes: 1,
        status: Status.Stopped,
        repoState: defaultRepoState,
        managedImages: testManagedImages,
        customImages: [],
        manualMineCount: 6,
      });
    });

    it('should rename a lightning LND node', async () => {
      const node = network.nodes.lightning.find(
        n => n.implementation === 'LND',
      ) as LndNode;
      const newName = 'new-lnd-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
      expect((updatedNode as LndNode).paths).toStrictEqual(
        getLndFilePaths(newName, network),
      );
    });

    it('should rename a lightning c-lightning node', async () => {
      const node = network.nodes.lightning.find(
        n => n.implementation === 'c-lightning',
      ) as CLightningNode;
      const newName = 'new-clightning-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
      const supportsGrpc = (updatedNode as CLightningNode).ports.grpc !== 0;
      expect((updatedNode as CLightningNode).paths).toStrictEqual(
        getCLightningFilePaths(newName, supportsGrpc, network),
      );
    });

    it('should rename a lightning lampo node', async () => {
      const node = network.nodes.lightning.find(
        n => n.implementation === 'lampo',
      ) as LampoNode;
      const newName = 'new-lampo-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
    });

    it('should rename a bitcoin node', async () => {
      const node = network.nodes.bitcoin[0] as BitcoinNode;
      const newName = 'new-bitcoin-node-name';
      const updatedNode = await renameNode(network, node, newName);
      expect(updatedNode).toBeDefined();
      expect(updatedNode.name).toBe(newName);
    });

    it('should throw an error for invalid node type', async () => {
      const invalidNode: any = { type: 'invalid', id: '123' };
      await expect(renameNode(network, invalidNode, 'new-name')).rejects.toThrow(
        'Invalid node type',
      );
    });

    it('should throw an error if node is not found', async () => {
      const nonExistentNode: any = { type: 'bitcoin', id: 'non-existent' };
      await expect(renameNode(network, nonExistentNode, 'new-name')).rejects.toThrow();
    });
  });
});

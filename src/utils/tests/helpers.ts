import { CommonNode, Status } from 'shared/types';
import appModel from 'store/models/app';
import bitcoinModel from 'store/models/bitcoin';
import designerModel from 'store/models/designer';
import lightningModel from 'store/models/lightning';
import mcpModel from 'store/models/mcp';
import modalsModel from 'store/models/modals';
import networkModel from 'store/models/network';
import { CustomImage, DockerRepoState, ManagedImage, Network } from 'types';
import { defaultRepoState } from 'utils/constants';
import { createNetwork } from '../network';

export const testNodeDocker: CommonNode['docker'] = { image: '', command: '' };

export const testManagedImages: ManagedImage[] = [
  { implementation: 'LND', version: defaultRepoState.images.LND.latest, command: '' },
  {
    implementation: 'c-lightning',
    version: defaultRepoState.images['c-lightning'].latest,
    command: '',
  },
  {
    implementation: 'lampo',
    version: defaultRepoState.images.lampo.latest,
    command: '',
  },
  {
    implementation: 'bitcoind',
    version: defaultRepoState.images.bitcoind.latest,
    command: '',
  },
];

export const testCustomImages: CustomImage[] = [
  {
    id: '123',
    name: 'My Custom Image',
    implementation: 'LND',
    dockerImage: 'lnd:master',
    command: 'test-command',
  },
  {
    id: '456',
    name: 'Another Custom Image',
    implementation: 'c-lightning',
    dockerImage: 'my-clightning:latest',
    command: 'another-command',
  },
];

export const testRepoState: DockerRepoState = {
  version: 50,
  images: {
    LND: {
      latest: '0.19.2-beta',
      versions: [
        '0.19.2-beta',
        '0.19.1-beta',
        '0.19.0-beta',
        '0.18.5-beta',
        '0.18.4-beta',
        '0.18.3-beta',
        '0.18.2-beta',
        '0.18.1-beta',
        '0.18.0-beta',
        '0.17.5-beta',
        '0.17.5-beta',
        '0.17.4-beta',
        '0.17.3-beta',
        '0.17.2-beta',
        '0.17.1-beta',
        '0.17.0-beta',
        '0.16.4-beta',
        '0.16.2-beta',
        '0.16.1-beta',
        '0.16.0-beta',
        '0.15.5-beta',
        '0.15.4-beta',
        '0.15.3-beta',
        '0.15.2-beta',
        '0.15.1-beta',
        '0.15.0-beta',
        '0.14.3-beta',
        '0.13.1-beta',
        '0.13.0-beta',
        '0.12.1-beta',
        '0.12.0-beta',
        '0.11.1-beta',
        '0.11.0-beta',
        '0.10.3-beta',
        '0.10.2-beta',
        '0.10.1-beta',
        '0.10.0-beta',
        '0.9.1-beta',
        '0.9.0-beta',
        '0.8.2-beta',
        '0.8.0-beta',
        '0.7.1-beta',
      ],
      // not all LND versions are compatible with all bitcoind versions.
      // this mapping specifies the highest compatible bitcoind for each LND version
      compatibility: {
        '0.19.2-beta': '30.0',
        '0.19.1-beta': '29.0',
        '0.19.0-beta': '29.0',
        '0.18.5-beta': '29.0',
        '0.18.4-beta': '29.0',
        '0.18.3-beta': '27.0',
        '0.18.2-beta': '27.0',
        '0.18.1-beta': '27.0',
        '0.18.0-beta': '27.0',
        '0.17.5-beta': '27.0',
        '0.17.4-beta': '27.0',
        '0.17.3-beta': '27.0',
        '0.17.2-beta': '27.0',
        '0.17.1-beta': '27.0',
        '0.17.0-beta': '27.0',
        '0.16.4-beta': '27.0',
        '0.16.2-beta': '25.0',
        '0.16.1-beta': '25.0',
        '0.16.0-beta': '25.0',
        '0.15.5-beta': '25.0',
        '0.15.4-beta': '25.0',
        '0.15.3-beta': '25.0',
        '0.15.2-beta': '25.0',
        '0.15.1-beta': '25.0',
        '0.15.0-beta': '25.0',
        '0.14.3-beta': '25.0',
        '0.14.2-beta': '22.0',
        '0.14.1-beta': '22.0',
        '0.13.1-beta': '22.0',
        '0.13.0-beta': '22.0',
        '0.12.1-beta': '22.0',
        '0.12.0-beta': '22.0',
        '0.11.1-beta': '22.0',
        '0.11.0-beta': '22.0',
        '0.10.3-beta': '22.0',
        '0.10.2-beta': '22.0',
        '0.10.1-beta': '0.19.1',
        '0.10.0-beta': '0.19.1',
        '0.9.1-beta': '0.19.1',
        '0.9.0-beta': '0.19.1',
        '0.8.2-beta': '0.19.1',
        '0.8.0-beta': '0.18.1',
        '0.7.1-beta': '0.18.1',
      },
    },
    'c-lightning': {
      latest: '24.08',
      versions: ['24.08', '24.05', '24.02.2', '23.11.2'],
    },
    lampo: {
      latest: '0.1.0-blake2b.1',
      versions: ['0.1.0-blake2b.1'],
    },
    bitcoind: {
      latest: '30.0',
      versions: [
        '30.0',
        '29.0',
        '28.0',
        '27.0',
        '26.0',
        '25.0',
        '24.0',
        '23.0',
        '22.0',
        '0.21.1',
        '0.19.1',
        '0.19.0.1',
        '0.18.1',
      ],
    },
    btcd: {
      latest: '',
      versions: [],
    },
  },
};

export const getNetwork = (
  networkId = 1,
  name?: string,
  status?: Status,
  description?: string,
): Network => {
  const config = {
    id: networkId,
    name: name || 'my-test',
    description: description || 'my-test-description',
    lndNodes: 3,
    clightningNodes: 1,
    lampoNodes: 0,
    bitcoindNodes: 1,
    status,
    repoState: defaultRepoState,
    managedImages: testManagedImages,
    customImages: [],
    manualMineCount: 6,
  };
  const network = createNetwork(config);

  return network;
};

export const mockProperty = <T, K extends keyof T>(
  object: T,
  property: K,
  value: T[K],
) => {
  Object.defineProperty(object, property, { get: () => value });
};

/**
 * Poor man's deep clone. Useful for tests to avoid another dependency
 */
export const clone = (data: any) => JSON.parse(JSON.stringify(data));

/**
 * Suppresses console errors when executing some code.
 * For example: antd Modal.confirm logs a console error when onOk fails
 * this suppresses those errors from being displayed in test runs
 * @param func the code to run
 */
export const suppressConsoleErrors = async (func: () => any | Promise<any>) => {
  const oldConsoleErr = console.error;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.error = () => {};
  const result = func();
  if (result && typeof result.then === 'function') {
    await result;
  }
  console.error = oldConsoleErr;
};

/**
 * Creates a mock root model for MCP tests.
 * This provides all the necessary models that MCP tools depend on.
 */
export const createMockRootModel = () => ({
  app: appModel,
  network: networkModel,
  lightning: lightningModel,
  bitcoin: bitcoinModel,
  designer: designerModel,
  modals: modalsModel,
  mcp: mcpModel,
});

import { NodeImplementation, NodeImplementationWithSimln } from 'shared/types';
import { DockerConfig, DockerRepoState } from 'types';
import bitcoindLogo from 'resources/bitcoin-knots.svg';
import clightningLogo from 'resources/clightning.png';
import lampoLogo from 'resources/lampo.png';
import lndLogo from 'resources/lnd.png';
import packageJson from '../../package.json';

// App
export const APP_VERSION = packageJson.version;

// Docker
export const DOCKER_REPO = 'ghcr.io/privkeyio/polar';

// bitcoind
export const INITIAL_BLOCK_REWARD = 50;
export const BLOCKS_TIL_CONFIRMED = 6;
export const COINBASE_MATURITY_DELAY = 100;
// https://github.com/bitcoin/bitcoin/blob/v0.19.0.1/src/chainparams.cpp#L258
export const HALVING_INTERVAL = 150;

// lnd
// number of addresses LND scans forward to find on-chain funds for a restored seed
export const SEED_RESTORE_RECOVERY_WINDOW = 2500;
// how long to wait for peers to broadcast force-close txns after a wallet restore
export const FORCE_CLOSE_WAIT_TIMEOUT = 30 * 1000;

// designer chart
export const LOADING_NODE_ID = 'loading_id';

// currency
export enum Denomination {
  SATOSHIS = 'SATOSHIS',
  BITCOIN = 'BITCOIN',
}

export const denominationSymbols: { [key in Denomination]: string } = {
  SATOSHIS: 'sats',
  BITCOIN: 'BTC',
};

export const denominationNames: { [key in Denomination]: string } = {
  SATOSHIS: 'Satoshis',
  BITCOIN: 'Bitcoin',
};

/**
 * The starting port numbers for the different node types. These should
 * be sufficiently spaced apart to allow a dozen or so numbers higher and
 * not cause conflicts
 */
export const BasePorts: Record<NodeImplementation, Record<string, number>> = {
  bitcoind: {
    rest: 18443,
    p2p: 19444,
    zmqBlock: 28334,
    zmqTx: 29335,
  },
  LND: {
    rest: 8081,
    grpc: 10001,
    p2p: 9735,
  },
  'c-lightning': {
    rest: 8181,
    p2p: 9835,
    grpc: 11001,
  },
  lampo: {
    rest: 8281,
    p2p: 9935,
  },
  btcd: {},
};

export const bitcoinCredentials = {
  user: 'polaruser',
  pass: 'polarpass',
  rpcauth:
    '5e5e98c21f5c814568f8b55d83b23c1c$$066b03f92df30b11de8e4b1b1cd5b1b4281aa25205bd57df9be82caf97a05526',
};

export const dockerConfigs: Record<NodeImplementationWithSimln, DockerConfig> = {
  LND: {
    name: 'LND',
    imageName: `${DOCKER_REPO}/lnd`,
    logo: lndLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'lnd',
    command: [
      'lnd',
      '--noseedbackup',
      '--debuglevel=debug',
      '--trickledelay=5000',
      '--alias={{name}}',
      '--externalip={{name}}',
      '--tlsextradomain={{name}}',
      '--tlsextradomain={{containerName}}',
      '--tlsextradomain=host.docker.internal',
      '--listen=0.0.0.0:9735',
      '--rpclisten=0.0.0.0:10009',
      '--restlisten=0.0.0.0:8080',
      '--bitcoin.active',
      '--bitcoin.regtest',
      '--bitcoin.node=bitcoind',
      '--bitcoind.rpchost={{backendName}}',
      '--bitcoind.rpcuser={{rpcUser}}',
      '--bitcoind.rpcpass={{rpcPass}}',
      '--bitcoind.zmqpubrawblock=tcp://{{backendName}}:28334',
      '--bitcoind.zmqpubrawtx=tcp://{{backendName}}:28335',
      '--accept-keysend',
      '--accept-amp',
      '--bitcoin.blake2b-activation-height=1',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['name', 'containerName', 'backendName', 'rpcUser', 'rpcPass'],
  },
  'c-lightning': {
    name: 'Core Lightning',
    imageName: `${DOCKER_REPO}/clightning`,
    logo: clightningLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'c-lightning',
    command: [
      'lightningd',
      '--alias={{name}}',
      '--addr={{name}}',
      '--addr=0.0.0.0:9735',
      '--network=regtest',
      '--bitcoin-rpcuser={{rpcUser}}',
      '--bitcoin-rpcpassword={{rpcPass}}',
      '--bitcoin-rpcconnect={{backendName}}',
      '--bitcoin-rpcport=18443',
      '--log-level=debug',
      '--dev-bitcoind-poll=2',
      '--dev-fast-gossip',
      '--grpc-host=0.0.0.0',
      '--grpc-port=11001',
      '--log-file=-', // log to stdout
      '--log-file=/home/clightning/.lightning/debug.log',
      '--clnrest-port=8080',
      '--clnrest-protocol=http',
      '--clnrest-host=0.0.0.0',
      '--clnrest-cors-origins=*',
      '--developer',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['name', 'backendName', 'rpcUser', 'rpcPass'],
    dataDir: 'lightningd',
    apiDir: 'rest-api',
  },
  lampo: {
    name: 'Lampo',
    imageName: `${DOCKER_REPO}/lampo`,
    logo: lampoLogo,
    platforms: ['mac', 'linux'],
    volumeDirName: 'lampo',
    command: [
      'lampod-cli',
      '--data-dir=/home/lampo/.lampo',
      '--network=regtest',
      '--client=core',
      '--core-url=http://{{backendName}}:18443',
      '--core-user={{rpcUser}}',
      '--core-pass={{rpcPass}}',
      '--api-host=0.0.0.0',
      '--api-port=7979',
      '--log-level=debug',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['backendName', 'rpcUser', 'rpcPass'],
  },
  bitcoind: {
    name: 'Bitcoin Knots',
    imageName: `${DOCKER_REPO}/bitcoind`,
    logo: bitcoindLogo,
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'bitcoind',
    command: [
      'bitcoind',
      '-server=1',
      '-regtest=1',
      '-rpcauth={{rpcUser}}:{{rpcAuth}}',
      '-debug=1',
      '-zmqpubrawblock=tcp://0.0.0.0:28334',
      '-zmqpubrawtx=tcp://0.0.0.0:28335',
      '-zmqpubhashblock=tcp://0.0.0.0:28336',
      '-txindex=1',
      '-dnsseed=0',
      '-rpcbind=0.0.0.0',
      '-rpcallowip=0.0.0.0/0',
      '-rpcport=18443',
      '-rest',
      '-listen=1',
      '-listenonion=0',
      '-fallbackfee=0.0002',
      '-blockfilterindex=1',
      '-peerblockfilters=1',
      '-testactivationheight=blake2b@1',
      '-rejectparasites=0',
    ].join('\n  '),
    // if vars are modified, also update composeFile.ts & the i18n strings for cmps.nodes.CommandVariables
    variables: ['rpcUser', 'rpcAuth'],
  },
  btcd: {
    name: 'btcd',
    imageName: '',
    logo: '',
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'btcd',
    command: '',
    variables: [],
  },
  simln: {
    name: 'simln',
    imageName: 'polarlightning/simln:0.2.5',
    logo: '',
    platforms: ['mac', 'linux', 'windows'],
    volumeDirName: 'simln',
    env: {
      SIMFILE_PATH: '/home/simln/.simln/sim.json',
      DATA_DIR: '/home/simln/.simln',
      LOG_LEVEL: 'info',
    },
    command: '',
    variables: [],
  },
};

/**
 * The URL containing the metadata for the images available on Docker Hub. If the contents of
 * this URL is newer than the state defined below, then the user can update their local list of
 * images and use new versions without needing to update the Polar app
 */
export const REPO_STATE_URL =
  'https://raw.githubusercontent.com/privkeyio/polar/master/docker/nodes.json';

/**
 * this defines the hard-coded list of docker images available in the Polar app. When new images
 * are pushed to Docker Hub, this list should be updated along with the /docker/nodes.json file.
 */
export const defaultRepoState: DockerRepoState = {
  version: 2,
  images: {
    LND: {
      latest: '0.21.3-beta-blake2b.17',
      versions: ['0.21.3-beta-blake2b.17'],
      // not all LND versions are compatible with all bitcoind versions.
      // this mapping specifies the highest compatible bitcoind for each LND version
      compatibility: {
        '0.21.3-beta-blake2b.17': '29.4.2',
      },
    },
    'c-lightning': {
      latest: '26.06.9-blake2b.7',
      versions: ['26.06.9-blake2b.7'],
    },
    lampo: {
      latest: '0.1.0-blake2b.1',
      versions: ['0.1.0-blake2b.1'],
    },
    bitcoind: {
      latest: '29.4.2',
      versions: ['29.4.2'],
    },
    btcd: {
      latest: '',
      versions: [],
    },
  },
};

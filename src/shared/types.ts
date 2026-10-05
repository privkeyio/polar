export enum Status {
  Starting,
  Started,
  Stopping,
  Stopped,
  Error,
  Locked,
}

export interface CommonNode {
  id: number;
  networkId: number;
  name: string;
  type: 'bitcoin' | 'lightning';
  version: string;
  status: Status;
  errorMsg?: string;
  docker: {
    image: string;
    command: string;
  };
}

export interface LightningNode extends CommonNode {
  type: 'lightning';
  implementation: 'LND' | 'c-lightning';
  backendName: string;
  ports: Record<string, number | undefined>;
}

export interface LndNode extends LightningNode {
  implementation: 'LND';
  paths: {
    tlsCert: string;
    adminMacaroon: string;
    invoiceMacaroon: string;
    readonlyMacaroon: string;
  };
  ports: {
    rest: number;
    grpc: number;
    p2p: number;
  };
}

export interface CLightningNode extends LightningNode {
  implementation: 'c-lightning';
  paths: {
    rune: string;
    tlsCert?: string;
    tlsClientCert?: string;
    tlsClientKey?: string;
  };
  ports: {
    rest: number;
    grpc: number;
    p2p: number;
  };
}

export interface BitcoinNode extends CommonNode {
  type: 'bitcoin';
  implementation: 'bitcoind' | 'btcd';
  peers: string[];
  ports: Record<string, number>;
}

export interface BitcoindNode extends BitcoinNode {
  implementation: 'bitcoind';
  ports: {
    rpc: number;
    p2p: number;
    zmqBlock: number;
    zmqTx: number;
  };
}

export type NodeImplementation =
  | BitcoinNode['implementation']
  | LightningNode['implementation'];

export type NodeImplementationWithSimln = NodeImplementation | 'simln';

export type AnyNode = BitcoinNode | LightningNode;

export interface OpenChannelOptions {
  from: LightningNode;
  toRpcUrl: string;
  amount: string;
  isPrivate: boolean;
}

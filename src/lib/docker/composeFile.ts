import { BitcoinNode, CLightningNode, CommonNode, LndNode } from 'shared/types';
import { bitcoinCredentials, dockerConfigs } from 'utils/constants';
import { getContainerName, getDefaultCommand } from 'utils/network';
import { isWindows } from 'utils/system';
import { bitcoind, clightning, lnd, simln } from './nodeTemplates';

export interface ComposeService {
  image: string;
  container_name: string;
  environment?: Record<string, string>;
  hostname: string;
  command: string;
  volumes: string[];
  expose: string[];
  ports: string[];
  restart?: 'always';
  stop_grace_period?: string;
}

export interface ComposeContent {
  name: string;
  services: {
    [key: string]: ComposeService;
  };
  volumes?: {
    [key: string]: { name: string } | null;
  };
}

class ComposeFile {
  content: ComposeContent;

  constructor(id: number) {
    this.content = {
      name: `polar-network-${id}`,
      services: {},
    };
  }

  addService(service: ComposeService) {
    this.content.services[service.hostname] = {
      environment: {
        USERID: '${USERID:-1000}',
        GROUPID: '${GROUPID:-1000}',
        ...service.environment,
      },
      stop_grace_period: '30s',
      ...service,
    };
  }

  addBitcoind(node: BitcoinNode) {
    const { name, version, ports } = node;
    const { rpc, p2p, zmqBlock, zmqTx } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      rpcUser: bitcoinCredentials.user,
      rpcAuth: bitcoinCredentials.rpcauth,
    };
    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.bitcoind.imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    const nodeCommand = node.docker.command || getDefaultCommand('bitcoind', version);
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const svc = bitcoind(name, container, image, rpc, p2p, zmqBlock, zmqTx, command);
    this.addService(svc);
  }

  addLnd(node: LndNode, backend: CommonNode) {
    const { name, version, ports } = node;
    const { rest, grpc, p2p } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      name: node.name,
      containerName: container,
      backendName: getContainerName(backend),
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
    };
    // use the node's custom image or the default for the implementation
    const image = node.docker.image || `${dockerConfigs.LND.imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    const nodeCommand = node.docker.command || getDefaultCommand('LND', version);
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // add the docker service
    const svc = lnd(name, container, image, rest, grpc, p2p, command);
    this.addService(svc);
  }

  addClightning(node: CLightningNode, backend: CommonNode) {
    const { name, version, ports } = node;
    const { rest, p2p, grpc } = ports;
    const container = getContainerName(node);
    // define the variable substitutions
    const variables = {
      name: node.name,
      backendName: getContainerName(backend),
      rpcUser: bitcoinCredentials.user,
      rpcPass: bitcoinCredentials.pass,
    };
    // use the node's custom image or the default for the implementation
    const image =
      node.docker.image || `${dockerConfigs['c-lightning'].imageName}:${version}`;
    // use the node's custom command or the default for the implementation
    let nodeCommand = node.docker.command || getDefaultCommand('c-lightning', version);
    // do not include the GRPC port arg in the command for unsupported versions
    if (grpc === 0) nodeCommand = nodeCommand.replace('--grpc-port=11001', '');
    // replace the variables in the command
    const command = this.mergeCommand(nodeCommand, variables);
    // On Windows, use a named Docker volume for CLN's data directory instead of a bind mount.
    let namedVolumeName: string | undefined;
    if (isWindows()) {
      namedVolumeName = container;
      // register the named volume in the top-level volumes declaration
      if (!this.content.volumes) {
        this.content.volumes = {};
      }
      this.content.volumes[namedVolumeName] = null;
    }
    // add the docker service
    const svc = clightning(
      name,
      container,
      image,
      rest,
      grpc,
      p2p,
      command,
      namedVolumeName,
    );
    this.addService(svc);
  }

  addSimln(networkId: number) {
    const { name, imageName, command, env } = dockerConfigs.simln;
    const containerName = `polar-n${networkId}-simln`;
    const svc = simln(name, containerName, imageName, command, { ...env });
    this.addService(svc);
  }

  private mergeCommand(command: string, variables: Record<string, string>) {
    let merged = command;
    Object.keys(variables).forEach(key => {
      // intentionally not using .replace() because if a string is passed in, then only the first occurrence
      // is replaced. A RegExp could be used but the code would be more confusing because of escape chars
      merged = merged.split(`{{${key}}}`).join(variables[key]);
    });
    return merged;
  }
}

export default ComposeFile;

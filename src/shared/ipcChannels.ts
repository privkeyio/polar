const channels = {
  // general app channels
  openWindow: 'open-window',
  clearCache: 'clear-cache',
  http: 'http',
  zip: 'zip',
  unzip: 'unzip',
  // MCP channels
  mcpExecuteTool: 'mcp-execute-tool',
  mcpToolDefinitions: 'mcp-tool-definitions',
  // LND proxy channels
  getInfo: 'get-info',
  walletBalance: 'wallet-balance',
  newAddress: 'new-address',
  listPeers: 'list-peers',
  connectPeer: 'connect-peer',
  openChannel: 'open-channel',
  closeChannel: 'close-channel',
  listChannels: 'list-channels',
  pendingChannels: 'pending-channels',
  getChanInfo: 'get-chan-info',
  createInvoice: 'create-invoice',
  payInvoice: 'pay-invoice',
  decodeInvoice: 'decode-invoice',
  setupListener: 'setup-listener',
  removeListener: 'remove-listener',
  subscribeChannelEvents: 'subscribe-channel-events',
  getState: 'get-state',
  genSeed: 'gen-seed',
  initWallet: 'init-wallet',
  unlockWallet: 'unlock-wallet',
};

export default {
  ...channels,
  redacted: [channels.genSeed, channels.initWallet, channels.unlockWallet],
};

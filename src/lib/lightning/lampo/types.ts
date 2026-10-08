/**
 * Lampo HTTP API (lampo-httpd) Request and Response Types
 */

export interface ErrorResponse {
  code: number;
  message: string;
  data?: any;
}

export interface GetInfoResponse {
  nodeId: string;
  peers: number;
  channels: number;
  chain: string;
  alias: string;
  blockheight: number;
  lampoDir: string;
  address: {
    address: string;
    port: number;
  }[];
  blockHash: string;
  walletHeight: number;
  walletScanHeight: number;
  syncInProgress: boolean;
  syncProgressPercent: number;
}

export interface FundsResponse {
  transactions: {
    txid: string;
    vout: number;
    reserved: boolean;
    confirmed: number;
    amountMsat: number;
  }[];
}

export interface NewAddrResponse {
  address: string;
}

export interface Channel {
  channelId: string;
  shortChannelId: number | null;
  peerId: string;
  peerAlias: string | null;
  ready: boolean;
  amount: number;
  amountMsat: number;
  public: boolean;
  availableBalanceForSendMsat: number;
  availableBalanceForRecvMsat: number;
  isOutbound: boolean;
  fundingTxo: string | null;
}

export interface ChannelsResponse {
  channels: Channel[];
}

export interface PeersResponse {
  peers: {
    nodeId: string;
    address: string | null;
    inbound: boolean;
  }[];
}

export interface ConnectRequest {
  node_id: string;
  addr: string;
  port: number;
}

export interface FundChannelRequest {
  node_id: string;
  addr: string;
  port: number;
  amount: number;
  public: boolean;
}

export interface FundChannelResponse {
  nodeId: string;
  amount: number;
  public: boolean;
  pushMsat: number;
  toSelfDelay: number;
  tx: any;
  txid: string;
}

export interface CloseRequest {
  node_id: string;
  channel_id: string;
  force: boolean;
}

export interface InvoiceRequest {
  amount_msat: number;
  description: string;
  expiring_in?: number;
}

export interface InvoiceResponse {
  bolt11: string;
}

export interface PayRequest {
  invoice_str: string;
  amount?: number;
}

export interface PayResponse {
  path: {
    nodeId: string;
    shortChannelId: number;
    hopFeeMsat: number;
    cltvExpiryDelta: number;
    privateHop: boolean;
  }[];
  paymentHash: string | null;
  state: 'Success' | 'Pending' | 'Failure';
  valueMsat: number;
  feeMsat: number;
  reason: string | null;
  paymentPreimage: string;
}

export interface DecodeRequest {
  invoice_str: string;
}

export interface DecodeResponse {
  paymentHash: string;
  amountMsat: number | null;
  expiryTime: number | null;
}

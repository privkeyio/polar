import { Action, action, Thunk, thunk } from 'easy-peasy';
import { StoreInjections } from 'types';
import { RootModel } from './';

interface OpenChannelModel {
  visible: boolean;
  to?: string;
  from?: string;
  linkId?: string;
}

interface ChangeBackendModel {
  visible: boolean;
  lnName?: string;
  backendName?: string;
  linkId?: string;
}

interface CreateInvoiceModel {
  visible: boolean;
  nodeName?: string;
  amount?: number;
  // displayed after the invoice is created
  invoice?: string;
}

interface PayInvoiceModel {
  visible: boolean;
  nodeName?: string;
}

interface AdvancedOptionsModel {
  visible: boolean;
  nodeName?: string;
  command?: string;
  defaultCommand?: string;
}

interface BalanceChannelsModel {
  visible: boolean;
}

interface ImageUpdatesModel {
  visible: boolean;
}

interface SendOnChainModel {
  visible: boolean;
  backendName?: string;
  toAddress?: string;
  amount?: number;
}

interface RenameNodeModel {
  visible: boolean;
  oldNodeName?: string;
}

interface UnlockNodeModel {
  visible: boolean;
  nodeName?: string;
}

interface AddSimulationModel {
  visible: boolean;
  // form values entered by the user
  source?: string;
  destination?: string;
  interval?: number;
  amount?: number;
}

export interface ModalsModel {
  openChannel: OpenChannelModel;
  changeBackend: ChangeBackendModel;
  createInvoice: CreateInvoiceModel;
  payInvoice: PayInvoiceModel;
  advancedOptions: AdvancedOptionsModel;
  balanceChannels: BalanceChannelsModel;
  imageUpdates: ImageUpdatesModel;
  sendOnChain: SendOnChainModel;
  renameNode: RenameNodeModel;
  unlockNode: UnlockNodeModel;
  addSimulation: AddSimulationModel;
  setOpenChannel: Action<ModalsModel, OpenChannelModel>;
  showOpenChannel: Thunk<ModalsModel, Partial<OpenChannelModel>, StoreInjections>;
  hideOpenChannel: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setChangeBackend: Action<ModalsModel, ChangeBackendModel>;
  showChangeBackend: Thunk<ModalsModel, Partial<ChangeBackendModel>, StoreInjections>;
  hideChangeBackend: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setCreateInvoice: Action<ModalsModel, CreateInvoiceModel>;
  showCreateInvoice: Thunk<ModalsModel, Partial<CreateInvoiceModel>, StoreInjections>;
  hideCreateInvoice: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setPayInvoice: Action<ModalsModel, PayInvoiceModel>;
  showPayInvoice: Thunk<ModalsModel, Partial<PayInvoiceModel>, StoreInjections>;
  hidePayInvoice: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setAdvancedOptions: Action<ModalsModel, AdvancedOptionsModel>;
  showAdvancedOptions: Thunk<ModalsModel, Partial<AdvancedOptionsModel>, StoreInjections>;
  hideAdvancedOptions: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  hideBalanceChannels: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  showBalanceChannels: Thunk<ModalsModel, void, StoreInjections>;
  setBalanceChannels: Action<ModalsModel, BalanceChannelsModel>;
  setImageUpdates: Action<ModalsModel, ImageUpdatesModel>;
  showImageUpdates: Thunk<ModalsModel, void, StoreInjections>;
  hideImageUpdates: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setSendOnChain: Action<ModalsModel, SendOnChainModel>;
  showSendOnChain: Thunk<ModalsModel, Partial<SendOnChainModel>, StoreInjections>;
  hideSendOnChain: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setRenameNode: Action<ModalsModel, RenameNodeModel>;
  showRenameNode: Thunk<ModalsModel, Partial<RenameNodeModel>, StoreInjections>;
  hideRenameNode: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setUnlockNode: Action<ModalsModel, UnlockNodeModel>;
  showUnlockNode: Thunk<ModalsModel, Partial<UnlockNodeModel>, StoreInjections>;
  hideUnlockNode: Thunk<ModalsModel, void, StoreInjections, RootModel>;
  setAddSimulation: Action<ModalsModel, AddSimulationModel>;
  showAddSimulation: Thunk<ModalsModel, Partial<AddSimulationModel>, StoreInjections>;
  hideAddSimulation: Thunk<ModalsModel, void, StoreInjections, RootModel>;
}

const modalsModel: ModalsModel = {
  // state properties
  openChannel: { visible: false },
  changeBackend: { visible: false },
  createInvoice: { visible: false },
  payInvoice: { visible: false },
  advancedOptions: { visible: false },
  balanceChannels: { visible: false },
  imageUpdates: { visible: false },
  sendOnChain: { visible: false },
  renameNode: { visible: false },
  unlockNode: { visible: false },
  addSimulation: { visible: false },
  // reducer actions (mutations allowed thx to immer)
  setOpenChannel: action((state, payload) => {
    state.openChannel = {
      ...state.openChannel,
      ...payload,
    };
  }),
  showOpenChannel: thunk((actions, { to, from, linkId }) => {
    actions.setOpenChannel({ visible: true, to, from, linkId });
  }),
  hideOpenChannel: thunk((actions, payload, { getStoreActions, getState }) => {
    const { linkId } = getState().openChannel;
    if (linkId) {
      // remove the link on the chart if the channel was not opened
      getStoreActions().designer.removeLink(linkId);
    }
    actions.setOpenChannel({
      visible: false,
      to: undefined,
      from: undefined,
      linkId: undefined,
    });
  }),
  setChangeBackend: action((state, payload) => {
    state.changeBackend = {
      ...state.changeBackend,
      ...payload,
    };
  }),
  showChangeBackend: thunk((actions, { lnName, backendName, linkId }) => {
    actions.setChangeBackend({ visible: true, lnName, backendName, linkId });
  }),
  hideChangeBackend: thunk((actions, payload, { getStoreActions, getState }) => {
    const { linkId } = getState().changeBackend;
    if (linkId) {
      // remove the link on the chart if the backend wasn't changed
      getStoreActions().designer.removeLink(linkId);
    }
    actions.setChangeBackend({
      visible: false,
      lnName: undefined,
      backendName: undefined,
      linkId: undefined,
    });
  }),
  setCreateInvoice: action((state, payload) => {
    state.createInvoice = {
      ...state.createInvoice,
      ...payload,
    };
  }),
  showCreateInvoice: thunk((actions, { nodeName, invoice, amount }) => {
    actions.setCreateInvoice({ visible: true, nodeName, invoice, amount });
  }),
  hideCreateInvoice: thunk(actions => {
    actions.setCreateInvoice({
      visible: false,
      nodeName: undefined,
      invoice: undefined,
      amount: undefined,
    });
  }),
  setPayInvoice: action((state, payload) => {
    state.payInvoice = {
      ...state.payInvoice,
      ...payload,
    };
  }),
  showPayInvoice: thunk((actions, { nodeName }) => {
    actions.setPayInvoice({ visible: true, nodeName });
  }),
  hidePayInvoice: thunk(actions => {
    actions.setPayInvoice({
      visible: false,
      nodeName: undefined,
    });
  }),
  setAdvancedOptions: action((state, payload) => {
    state.advancedOptions = {
      ...state.advancedOptions,
      ...payload,
    };
  }),
  showAdvancedOptions: thunk((actions, { nodeName, command, defaultCommand }) => {
    actions.setAdvancedOptions({ visible: true, nodeName, command, defaultCommand });
  }),
  hideAdvancedOptions: thunk(actions => {
    actions.setAdvancedOptions({
      visible: false,
      nodeName: undefined,
      command: undefined,
      defaultCommand: undefined,
    });
  }),
  setBalanceChannels: action((state, payload) => {
    state.balanceChannels = {
      ...state.balanceChannels,
      ...payload,
    };
  }),
  showBalanceChannels: thunk(actions => {
    actions.setBalanceChannels({ visible: true });
  }),
  hideBalanceChannels: thunk(actions => {
    actions.setBalanceChannels({ visible: false });
  }),

  setImageUpdates: action((state, payload) => {
    state.imageUpdates = {
      ...state.imageUpdates,
      ...payload,
    };
  }),
  showImageUpdates: thunk(actions => {
    actions.setImageUpdates({ visible: true });
  }),
  hideImageUpdates: thunk(actions => {
    actions.setImageUpdates({ visible: false });
  }),
  setSendOnChain: action((state, payload) => {
    state.sendOnChain = {
      ...state.sendOnChain,
      ...payload,
    };
  }),
  showSendOnChain: thunk((actions, { toAddress, backendName, amount }) => {
    actions.setSendOnChain({ visible: true, toAddress, backendName, amount });
  }),
  hideSendOnChain: thunk(actions => {
    actions.setSendOnChain({
      visible: false,
      toAddress: undefined,
      backendName: undefined,
      amount: undefined,
    });
  }),
  setRenameNode: action((state, payload) => {
    state.renameNode = {
      ...state.renameNode,
      ...payload,
    };
  }),
  showRenameNode: thunk((actions, { oldNodeName }) => {
    actions.setRenameNode({ visible: true, oldNodeName });
  }),
  hideRenameNode: thunk(actions => {
    actions.setRenameNode({
      visible: false,
      oldNodeName: undefined,
    });
  }),
  setUnlockNode: action((state, payload) => {
    state.unlockNode = {
      ...state.unlockNode,
      ...payload,
    };
  }),
  showUnlockNode: thunk((actions, { nodeName }) => {
    actions.setUnlockNode({ visible: true, nodeName });
  }),
  hideUnlockNode: thunk(actions => {
    actions.setUnlockNode({
      visible: false,
      nodeName: undefined,
    });
  }),
  setAddSimulation: action((state, payload) => {
    state.addSimulation = {
      ...state.addSimulation,
      ...payload,
    };
  }),
  showAddSimulation: thunk(actions => {
    actions.setAddSimulation({ visible: true });
  }),
  hideAddSimulation: thunk(actions => {
    actions.setAddSimulation({
      visible: false,
      source: undefined,
      destination: undefined,
      interval: undefined,
      amount: undefined,
    });
  }),
};

export default modalsModel;

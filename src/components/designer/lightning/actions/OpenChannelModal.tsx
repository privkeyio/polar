import React, { useMemo } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook';
import { Alert, Checkbox, Col, Form, InputNumber, Modal, Row } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { Loader } from 'components/common';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface FormValues {
  isPrivate: boolean;
  autoFund: boolean;
  to: string;
  from: string;
  capacity: string;
}

interface Props {
  network: Network;
}

const OpenChannelModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.OpenChannelModal',
  );
  const { nodes } = useStoreState(s => s.lightning);
  const { visible, to, from } = useStoreState(s => s.modals.openChannel);
  const { hideOpenChannel } = useStoreActions(s => s.modals);
  const { getWalletBalance, openChannel } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const [form] = Form.useForm();
  const selectedFrom = Form.useWatch<string>('from', form) || '';
  const selectedTo = Form.useWatch<string>('to', form) || '';
  const capacity = Form.useWatch<number>('capacity', form) || 0;

  const getBalancesAsync = useAsync(async () => {
    if (!visible) return;
    const nodes = network.nodes.lightning.filter(n => n.status === Status.Started);
    for (const node of nodes) {
      await getWalletBalance(node);
    }
  }, [network.nodes, visible]);

  const openChanAsync = useAsyncCallback(async (values: FormValues) => {
    try {
      const { lightning } = network.nodes;
      const fromNode = lightning.find(n => n.name === values.from);
      const toNode = lightning.find(n => n.name === values.to);
      if (!fromNode || !toNode) return;

      await openChannel({
        from: fromNode,
        to: toNode,
        sats: values.capacity,
        autoFund: showDeposit && values.autoFund,
        isPrivate: values.isPrivate,
      });
      hideOpenChannel();
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const sameNode = selectedFrom === selectedTo;
  const showDeposit = useMemo(() => {
    const confirmed = nodes?.[selectedFrom]?.walletBalance?.confirmed || '0';
    const balance = parseInt(confirmed);
    return !sameNode && balance < capacity;
  }, [selectedFrom, capacity, nodes, sameNode]);

  let cmp = (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      colon={false}
      initialValues={{
        from,
        to,
        capacity: 10_000_000,
        autoFund: true,
        isPrivate: false,
      }}
      onFinish={openChanAsync.execute}
      disabled={openChanAsync.loading}
    >
      {sameNode && <Alert type="error" message={l('sameNodesWarnMsg')} />}
      <Row gutter={16}>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="from"
            label={l('source')}
            nodeStatus={Status.Started}
            initialValue={from}
            nodes={nodes}
          />
        </Col>
        <Col span={12}>
          <LightningNodeSelect
            network={network}
            name="to"
            label={l('dest')}
            nodeStatus={Status.Started}
            initialValue={to}
            nodes={nodes}
          />
        </Col>
      </Row>
      <Form.Item
        name="capacity"
        label={l('capacityLabel')}
        rules={[{ required: true, message: l('cmps.forms.required') }]}
      >
        <InputNumber<number>
          formatter={v =>
            `${v}`
              // add commas between every 3 digits
              .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              // remove commas after the decimal point
              .replace(/\..*/, match => match.replace(/,/g, ''))
          }
          parser={v => parseFloat(`${v}`.replace(/(undefined|,*)/g, ''))}
          style={{ width: '100%' }}
        />
      </Form.Item>
      {showDeposit && (
        <Form.Item name="autoFund" valuePropName="checked">
          <Checkbox>{l('deposit', { selectedFrom })}</Checkbox>
        </Form.Item>
      )}
      <Form.Item name="isPrivate" valuePropName="checked">
        <Checkbox>{l('private')}</Checkbox>
      </Form.Item>
    </Form>
  );

  if (getBalancesAsync.loading) {
    cmp = <Loader />;
  } else if (getBalancesAsync.error) {
    cmp = (
      <Alert
        type="error"
        message={l('balancesError')}
        description={getBalancesAsync.error.message}
      />
    );
  }

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideOpenChannel()}
        destroyOnClose
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: openChanAsync.loading,
          disabled: sameNode,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default OpenChannelModal;

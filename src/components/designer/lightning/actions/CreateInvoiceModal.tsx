import React, { ReactNode } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import CopyToClipboard from 'react-copy-to-clipboard';
import { Button, Collapse, Form, Input, InputNumber, message, Modal, Result } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { useStoreActions, useStoreState } from 'store';
import { Network } from 'types';
import { format } from 'utils/units';
import CopyableInput from 'components/common/form/CopyableInput';
import LightningNodeSelect from 'components/common/form/LightningNodeSelect';

interface FormValues {
  node: string;
  amount: number;
  memo?: string;
  expiry?: number;
}

interface Props {
  network: Network;
}

const CreateInvoiceModal: React.FC<Props> = ({ network }) => {
  const { l } = usePrefixedTranslation(
    'cmps.designer.lightning.actions.CreateInvoiceModal',
  );
  const { visible, nodeName, invoice, amount } = useStoreState(
    s => s.modals.createInvoice,
  );
  const { showCreateInvoice, hideCreateInvoice } = useStoreActions(s => s.modals);
  const { createInvoice } = useStoreActions(s => s.lightning);
  const { notify } = useStoreActions(s => s.app);

  const [form] = Form.useForm();
  const createAsync = useAsyncCallback(async (values: FormValues) => {
    try {
      const { lightning } = network.nodes;
      const node = lightning.find(n => n.name === values.node);
      if (!node || !values.amount) return;

      const amount = parseInt(`${values.amount}`);
      const invoice = await createInvoice({
        node,
        amount,
        memo: values.memo,
        expiry: values.expiry,
      });
      await showCreateInvoice({
        nodeName: node.name,
        amount: values.amount,
        invoice,
      });
    } catch (error: any) {
      notify({ message: l('submitError'), error });
    }
  });

  const handleCopy = () => {
    message.success(l('copied'), 2);
    hideCreateInvoice();
  };

  let cmp: ReactNode;
  if (!invoice) {
    cmp = (
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        colon={false}
        initialValues={{ node: nodeName, amount: 1_000_000 }}
        onFinish={createAsync.execute}
      >
        <LightningNodeSelect
          network={network}
          name="node"
          label={l('nodeLabel')}
          disabled={createAsync.loading}
        />
        <Form.Item
          name="amount"
          label={l('amountLabel')}
          rules={[{ required: true, message: l('cmps.forms.required') }]}
        >
          <InputNumber<number>
            min={1}
            disabled={createAsync.loading}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => parseFloat(`${v}`.replace(/(undefined|,*)/g, ''))}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Collapse>
          <Collapse.Panel header={l('advancedOptions')} key="advanced">
            <Form.Item name="memo" label={l('memoLabel')}>
              <Input
                placeholder={l('memoPlaceholder')}
                disabled={createAsync.loading}
                style={{ width: '100%' }}
                maxLength={639}
              />
            </Form.Item>
            <Form.Item
              name="expiry"
              label={l('expiryLabel')}
              tooltip={l('expiryTooltip')}
            >
              <InputNumber<number>
                min={1}
                placeholder={l('expiryPlaceholder')}
                disabled={createAsync.loading}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    );
  } else {
    cmp = (
      <Result
        status="success"
        title={l('successTitle')}
        subTitle={l('successDesc', {
          nodeName,
          amount: format(`${amount}`),
          assetName: 'sats',
        })}
        extra={
          <Form>
            <Form.Item>
              <CopyableInput label="Invoice" value={invoice} />
            </Form.Item>
            <Form.Item>
              <CopyToClipboard text={invoice} onCopy={handleCopy}>
                <Button type="primary">{l('copyClose')}</Button>
              </CopyToClipboard>
            </Form.Item>
          </Form>
        }
      />
    );
  }

  return (
    <>
      <Modal
        title={l('title')}
        open={visible}
        onCancel={() => hideCreateInvoice()}
        destroyOnClose
        footer={invoice ? null : undefined}
        cancelText={l('cancelBtn')}
        okText={l('okBtn')}
        okButtonProps={{
          loading: createAsync.loading,
        }}
        onOk={form.submit}
      >
        {cmp}
      </Modal>
    </>
  );
};

export default CreateInvoiceModal;

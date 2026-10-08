import React, { ReactNode, useMemo, useState } from 'react';
import { useAsync } from 'react-async-hook';
import { BookOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import * as LND from '@lightningpolar/lnd-api';
import { Alert, Button, Radio, Tooltip } from 'antd';
import { usePrefixedTranslation } from 'hooks';
import { CLightningNode, LampoNode, LightningNode, LndNode, Status } from 'shared/types';
import { useStoreActions, useStoreState } from 'store';
import { ellipseInner } from 'utils/strings';
import { Loader } from 'components/common';
import CopyIcon from 'components/common/CopyIcon';
import DetailsList, { DetailValues } from 'components/common/DetailsList';
import { EncodedStrings, FilePaths, LndConnect } from './connect';

const Styled = {
  RadioGroup: styled(Radio.Group)`
    display: flex;
    justify-content: center;
    font-size: 12px;
    margin-bottom: 20px;
  `,
  Link: styled.a`
    margin-left: 10px;
    color: inherit;
    &:hover {
      opacity: 1;
    }
  `,
  BookIcon: styled(BookOutlined)`
    margin-left: 5px;
    color: #aaa;
  `,
  Alert: styled(Alert)`
    margin-bottom: 16px;
  `,
};

const authTypeLabelKeys: Record<string, string> = {
  paths: 'filePaths',
  hex: 'hexStrings',
  base64: 'base64Strings',
  lndc: 'lndConnect',
};

export interface ConnectionInfo {
  restUrl: string;
  restDocsUrl: string;
  grpcUrl?: string;
  grpcDocsUrl?: string;
  credentials: {
    // LND
    admin?: string;
    readOnly?: string;
    invoice?: string;
    cert?: string;
    // c-lightning
    clientCert?: string;
    clientKey?: string;
    rune?: string;
  };
  p2pUriExternal: string;
  authTypes: string[];
}

interface Props {
  node: LightningNode;
}

const ConnectTab: React.FC<Props> = ({ node }) => {
  const { l } = usePrefixedTranslation('cmps.designer.lightning.ConnectTab');
  const [authType, setAuthType] = useState<string>('paths');
  const { openInBrowser } = useStoreActions(s => s.app);
  const { getWalletState } = useStoreActions(s => s.lightning);
  const nodeState = useStoreState(s => s.lightning.nodes[node.name]);
  const pubkey = nodeState && nodeState.info ? nodeState.info.pubkey : '';
  const p2pLnUrlInternal = nodeState && nodeState.info ? nodeState.info.rpcUrl : '';

  // a Locked LND node could be waiting to be unlocked (macaroons on disk from a
  // previous init) or waiting to be initialized (no macaroons yet)
  // Status.Locked alone doesn't tell us which, so query the wallet state directly
  const isLockedLnd = node.status === Status.Locked && node.implementation === 'LND';
  const walletStateAsync = useAsync(async (): Promise<LND.WalletState | undefined> => {
    if (!isLockedLnd) return undefined;
    return await getWalletState(node as LndNode);
  }, [node, isLockedLnd]);
  const walletState = walletStateAsync.result;
  const walletNotInitialized = isLockedLnd && walletState === 'NON_EXISTING';

  const info = useMemo((): ConnectionInfo => {
    if (node.status === Status.Started || isLockedLnd) {
      if (node.implementation === 'LND') {
        const lnd = node as LndNode;
        return {
          restUrl: `https://127.0.0.1:${lnd.ports.rest}`,
          restDocsUrl: 'https://lightning.engineering/api-docs/api/lnd/',
          grpcUrl: `127.0.0.1:${lnd.ports.grpc}`,
          grpcDocsUrl: 'https://lightning.engineering/api-docs/api/lnd/',
          credentials: walletNotInitialized
            ? { cert: lnd.paths.tlsCert }
            : {
                admin: lnd.paths.adminMacaroon,
                readOnly: lnd.paths.readonlyMacaroon,
                invoice: lnd.paths.invoiceMacaroon,
                cert: lnd.paths.tlsCert,
              },
          p2pUriExternal: pubkey ? `${pubkey}@127.0.0.1:${lnd.ports.p2p}` : '',
          authTypes: walletNotInitialized
            ? ['paths']
            : ['paths', 'hex', 'base64', 'lndc'],
        };
      } else if (node.implementation === 'c-lightning') {
        const cln = node as CLightningNode;
        return {
          restUrl: `http://127.0.0.1:${cln.ports.rest}`,
          restDocsUrl: 'https://docs.corelightning.org/docs/rest',
          grpcUrl: cln.ports.grpc ? `127.0.0.1:${cln.ports.grpc}` : undefined,
          grpcDocsUrl: 'https://docs.corelightning.org/docs/grpc',
          credentials: {
            rune: cln.paths.rune,
            cert: cln.paths.tlsCert,
            clientCert: cln.paths.tlsClientCert,
            clientKey: cln.paths.tlsClientKey,
          },
          p2pUriExternal: `${pubkey}@127.0.0.1:${cln.ports.p2p}`,
          authTypes: ['paths', 'hex', 'base64'],
        };
      } else if (node.implementation === 'lampo') {
        const lampo = node as LampoNode;
        return {
          restUrl: `http://127.0.0.1:${lampo.ports.rest}`,
          restDocsUrl: 'https://github.com/privkeyio/lampo.rs',
          credentials: {},
          p2pUriExternal: `${pubkey}@127.0.0.1:${lampo.ports.p2p}`,
          authTypes: [],
        };
      }
    }

    return {
      restUrl: '',
      restDocsUrl: '',
      credentials: {},
      p2pUriExternal: '',
      authTypes: [],
    } as ConnectionInfo;
  }, [node, pubkey, isLockedLnd, walletNotInitialized]);

  // ensure an appropriate auth type is used when switching nodes
  const nodeAuthType = useMemo(() => {
    if (!info.authTypes.includes(authType)) {
      return info.authTypes[0];
    }
    return authType;
  }, [authType, info.authTypes]);

  if (isLockedLnd && walletStateAsync.loading) {
    return <Loader />;
  }

  if (isLockedLnd && walletStateAsync.error) {
    return (
      <Styled.Alert
        type="error"
        showIcon
        closable={false}
        message={l('walletStateError')}
        description={walletStateAsync.error.message}
        action={
          <Button size="small" onClick={() => walletStateAsync.execute()}>
            {l('retryBtn')}
          </Button>
        }
      />
    );
  }

  if (node.status !== Status.Started && !isLockedLnd) {
    return <>{l('notStarted')}</>;
  }

  const { restUrl, grpcUrl, credentials } = info;
  const hosts: DetailValues = [
    [l('grpcHost'), grpcUrl, grpcUrl],
    [l('restHost'), restUrl, restUrl],
    [l('p2pLnUrlInternal'), p2pLnUrlInternal, ellipseInner(p2pLnUrlInternal, 3, 17)],
    [
      l('p2pLnUrlExternal'),
      info.p2pUriExternal,
      ellipseInner(info.p2pUriExternal, 3, 17),
    ],
  ]
    .filter(h => !!h[1]) // exclude empty values
    .map(([label, value, text]) => ({
      label,
      value: <CopyIcon label={label} value={value as string} text={text} />,
    }));

  hosts.push({
    label: l('apiDocs'),
    value: (
      <>
        {info.grpcDocsUrl && (
          <Tooltip title={info.grpcDocsUrl}>
            <Styled.Link onClick={() => openInBrowser(info.grpcDocsUrl as string)}>
              GRPC
            </Styled.Link>
          </Tooltip>
        )}
        <Tooltip title={info.restDocsUrl}>
          <Styled.Link onClick={() => openInBrowser(info.restDocsUrl)}>REST</Styled.Link>
        </Tooltip>
        <Styled.BookIcon />
      </>
    ),
  });

  const authCmps: Record<string, ReactNode> = {
    paths: <FilePaths credentials={credentials} />,
    hex: <EncodedStrings credentials={credentials} encoding="hex" />,
    base64: <EncodedStrings credentials={credentials} encoding="base64" />,
    lndc: node.implementation === 'LND' && <LndConnect node={node as LndNode} />,
  };

  return (
    <>
      {isLockedLnd && (
        <Styled.Alert
          type={walletNotInitialized ? 'warning' : 'info'}
          showIcon
          closable={false}
          message={walletNotInitialized ? l('walletNotInitialized') : l('walletLocked')}
        />
      )}
      <DetailsList details={hosts} />
      <Styled.RadioGroup
        name="authType"
        value={nodeAuthType}
        size="small"
        onChange={e => setAuthType(e.target.value)}
      >
        {info.authTypes.map(type => (
          <Radio.Button key={type} value={type}>
            {l(authTypeLabelKeys[type])}
          </Radio.Button>
        ))}
      </Styled.RadioGroup>
      {authCmps[nodeAuthType]}
    </>
  );
};

export default ConnectTab;

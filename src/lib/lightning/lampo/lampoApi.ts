import { debug } from 'electron-log';
import { LampoNode, LightningNode } from 'shared/types';
import { httpRequest } from 'shared/utils';
import { snakeKeysToCamel } from 'utils/objects';
import * as LAMPO from './types';

export const httpPost = async <T>(
  node: LightningNode,
  method: string,
  bodyObj: any = {},
): Promise<T> => {
  if (node.implementation !== 'lampo')
    throw new Error(`LampoService cannot be used for '${node.implementation}' nodes`);

  const lampo = node as LampoNode;
  const id = Math.round(Math.random() * Date.now());
  const url = `http://127.0.0.1:${lampo.ports.rest}/${method}`;
  const body = JSON.stringify(bodyObj);
  debug(`Lampo API: [request] ${lampo.name} ${id} "${url}" ${body}`);

  const response = await httpRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  const json = JSON.parse(response);
  debug(`Lampo API: [response] ${lampo.name} ${id} ${JSON.stringify(json, null, 2)}`);

  const error = json as LAMPO.ErrorResponse;
  if (typeof error.code === 'number' && error.message) {
    throw new Error(error.message);
  }

  return snakeKeysToCamel(json) as T;
};

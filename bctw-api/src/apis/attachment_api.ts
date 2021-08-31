import { Request, Response } from 'express';
import {
  constructFunctionQuery,
  getRowResults,
  query,
} from '../database/query';
import { getUserIdentifier } from '../database/requests';
import { IAttachDeviceProps, IRemoveDeviceProps, IChangeDataLifeProps } from '../types/attachment';

/**
 * file contains API endpoints that handle the animal/device attachment
 */

const pg_get_history = 'get_animal_collar_assignment_history';
const pg_unlink_collar_fn = 'unlink_collar_to_animal';
const pg_link_collar_fn = 'link_collar_to_animal';

/**
 * handles critter collar assignment
 * @returns result of assignment row from the collar_animal_assignment table
 */
/*
*/
const attachDevice = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const body: IAttachDeviceProps = req.body;
  const { collar_id, critter_id, valid_from, valid_to } = body;

  if (!collar_id || !critter_id) {
    return res.status(500).send('collar_id & animal_id must be supplied');
  }
  const sql = constructFunctionQuery(pg_link_collar_fn, [getUserIdentifier(req), collar_id, critter_id, valid_from, valid_to]);
  const { result, error, isError } = await query(sql, 'unable to attach collar', true);

  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, pg_link_collar_fn));
}

/**
 * 
 * @returns 
 */
const unattachDevice = async function (
  req: Request,
  res: Response
) : Promise<Response> {

  const body: IRemoveDeviceProps = req.body;
  const { assignment_id, valid_from, valid_to } = body;
  const sql = constructFunctionQuery(pg_unlink_collar_fn, [getUserIdentifier(req), assignment_id, valid_from, valid_to]);
  const { result, error, isError } = await query(sql, 'unable to remove collar', true);

  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, pg_unlink_collar_fn));
}

/**
 * 
 * @returns 
 */
const updateDataLife = async function (
  req: Request,
  res: Response
) : Promise<Response> {
  const body: IChangeDataLifeProps = req.body;
  const { assignment_id, data_life_start, data_life_end } = body;
  const sql = constructFunctionQuery('todo:', [getUserIdentifier(req), assignment_id, data_life_start, data_life_end]);
  const { result, error, isError } = await query(sql, 'unable to change data life', true);

  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, 'todo:'));
}

/**
 * @param req.params.animal_id the critter_id of the history to retrieve
 * @returns the device attachment history
 */
const getCollarAssignmentHistory = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const id = getUserIdentifier(req);
  const critterId = req.params.animal_id as string;
  if (!critterId) {
    return res
      .status(500)
      .send('must supply critter_id to retrieve collar history');
  }
  const sql = constructFunctionQuery(pg_get_history, [id, critterId]);
  const { result, error, isError } = await query(sql);
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, pg_get_history));
};

export {
  pg_link_collar_fn,
  getCollarAssignmentHistory,
  attachDevice,
  unattachDevice,
  updateDataLife,
};

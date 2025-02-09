import { Request, Response } from 'express';
import {
  constructFunctionQuery,
  getRowResults,
  query,
} from '../database/query';
import { getUserIdentifier } from '../database/requests';
import { IAttachDeviceProps, IRemoveDeviceProps, IChangeDataLifeProps } from '../types/attachment';

/**
 * contains API endpoints that handle the animal/device attachment
 */

const pg_get_attachment_history = 'get_animal_collar_assignment_history';
const pg_unlink_collar_fn = 'unlink_collar_to_animal';
const pg_link_collar_fn = 'link_collar_to_animal';
const pg_update_data_life_fn = 'update_attachment_data_life';

/**
 * handles critter collar assignment
 * @returns result of assignment row from the collar_animal_assignment table
 */
const attachDevice = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const body: IAttachDeviceProps = req.body;
  const { collar_id, critter_id, attachment_start, data_life_start, attachment_end, data_life_end} = body;

  if (!collar_id || !critter_id) {
    return res.status(500).send('collar_id & animal_id must be supplied');
  }
  if (!attachment_start) {
    return res.status(500).send('must supply attachment start');
  }
  const sql = constructFunctionQuery(pg_link_collar_fn, [getUserIdentifier(req), collar_id, critter_id, attachment_start, data_life_start, attachment_end, data_life_end]);
  const { result, error, isError } = await query(sql, '', true);

  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, pg_link_collar_fn, true));
}

/**
 * removes a device from an animal 
 */
const unattachDevice = async function (
  req: Request,
  res: Response
) : Promise<Response> {

  const body: IRemoveDeviceProps = req.body;
  const { assignment_id, data_life_end, attachment_end} = body;
  const sql = constructFunctionQuery(pg_unlink_collar_fn, [getUserIdentifier(req), assignment_id, attachment_end, data_life_end]);
  const { result, error, isError } = await query(sql, 'unable to remove collar', true);

  if (isError) {
    return res.status(500).send(error.message);
  }
  console.log(sql);
  return res.send(getRowResults(result, pg_unlink_collar_fn, true));
}

/**
 * updates a device attachment's data life - the inner bounds of what a user consider's valid data 
 * the attachment_start / end dates cannot be changed.
 * start of data life must be after the attachment start, and data life end must be before attachment_end.
 * data life end cannot be changed while the device is still attached. 
 * data life start and end can only be modified once by a non-admin user.
 * @returns collar_animal_assignment row
 */
const updateDataLife = async function (
  req: Request,
  res: Response
) : Promise<Response> {
  const body: IChangeDataLifeProps = req.body;
  const { assignment_id, data_life_start, data_life_end } = body;
  const sql = constructFunctionQuery(pg_update_data_life_fn, [getUserIdentifier(req), assignment_id, data_life_start, data_life_end]);
  const { result, error, isError } = await query(sql, 'unable to change data life', true);

  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, pg_update_data_life_fn, true));
}

/**
 * @param req.params.animal_id the critter_id of the history to retrieve
 * @returns the device attachment history
 */
const getCollarAssignmentHistory = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const critterId = req.params.animal_id as string;
  if (!critterId) {
    return res
      .status(500)
      .send('must supply critter_id to retrieve collar history');
  }
  const sql = constructFunctionQuery(pg_get_attachment_history, [getUserIdentifier(req), critterId]);
  const { result, error, isError } = await query(sql);
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, pg_get_attachment_history));
};

export {
  pg_link_collar_fn,
  getCollarAssignmentHistory,
  attachDevice,
  unattachDevice,
  updateDataLife,
};

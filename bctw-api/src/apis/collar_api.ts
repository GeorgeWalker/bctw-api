import { Request, Response } from 'express';
import { S_API } from '../constants';

import {
  appendSqlFilter,
  constructFunctionQuery,
  constructGetQuery,
  getRowResults,
  momentNow,
  query,
} from '../database/query';
import { filterFromRequestParams, MISSING_IDIR } from '../database/requests';
import { createBulkResponse } from '../import/bulk_handlers';
import { ChangeCritterCollarProps, Collar } from '../types/collar';
import { IBulkResponse } from '../types/import_types';
import { IFilter, TelemetryTypes } from '../types/query';

const pg_add_collar_fn = 'add_collar';
const pg_update_collar_fn = 'update_collar';
const pg_link_collar_fn = 'link_collar_to_animal';
const pg_unlink_collar_fn = 'unlink_collar_to_animal';
const pg_get_collar_history = 'get_collar_history';

/**
 * @param alias the collar table alias
 * @param idir user idir
 * @returns a list of collars the user has access to. since a user is
 * associated with a set of critters.
 */
const _accessCollarControl = (alias: string, idir: string) => {
  return `and ${alias}.collar_id = any((${constructFunctionQuery(
    'get_user_collar_access',
    [idir]
  )})::uuid[])`;
};

/**
 *
 * @param idir user idir
 * @param collar a list of collars
 * @returns the result of the insert/upsert in the bulk rseponse format
 */
const addCollar = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const idir = (req?.query?.idir || '') as string;
  const bulkResp: IBulkResponse = { errors: [], results: [] };
  if (!idir) {
    bulkResp.errors.push({ row: '', error: MISSING_IDIR, rownum: 0 });
    return res.send(bulkResp);
  }
  const collars: Collar[] = !Array.isArray(req.body) ? [req.body] : req.body;
  const sql = constructFunctionQuery(pg_add_collar_fn, [idir, collars], true);
  const { result, error, isError } = await query(
    sql,
    'failed to add collar(s)',
    true
  );
  if (isError) {
    bulkResp.errors.push({ row: '', error: error.message, rownum: 0 });
  } else {
    createBulkResponse(bulkResp, getRowResults(result, pg_add_collar_fn)[0]);
  }
  return res.send(bulkResp);
};

/**
 *
 * @param req
 * @param res
 * @returns
 */
const updateCollar = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const idir = (req?.query?.idir || '') as string;
  const bulkResp: IBulkResponse = { errors: [], results: [] };
  if (!idir) {
    bulkResp.errors.push({ row: '', error: MISSING_IDIR, rownum: 0 });
    return res.send(bulkResp);
  }
  const collars: Collar[] = !Array.isArray(req.body) ? [req.body] : req.body;
  const sql = constructFunctionQuery(
    pg_update_collar_fn,
    [idir, collars],
    true
  );
  const { result, error, isError } = await query(
    sql,
    'failed to update collar',
    true
  );
  if (isError) {
    bulkResp.errors.push({ row: '', error: error.message, rownum: 0 });
  } else {
    createBulkResponse(bulkResp, getRowResults(result, pg_update_collar_fn)[0]);
  }
  return res.send(bulkResp);
};

/**
 * handles critter collar assignment/unassignment
 * @returns result of assignment row from the collar_animal_assignment table
 */
const assignOrUnassignCritterCollar = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const idir = req?.query?.idir as string;
  if (!idir) {
    return res.status(500).send(MISSING_IDIR);
  }

  const body: ChangeCritterCollarProps = req.body;
  const { collar_id, animal_id, valid_from, valid_to } = body.data;

  if (!collar_id || !animal_id) {
    return res.status(500).send('collar_id & animal_id must be supplied');
  }

  const db_fn_name = body.isLink ? pg_link_collar_fn : pg_unlink_collar_fn;
  const params = [idir, collar_id, animal_id];
  const errMsg = `failed to ${
    body.isLink ? 'attach' : 'remove'
  } device to critter ${animal_id}`;

  const functionParams = body.isLink
    ? [...params, valid_from, valid_to]
    : [...params, valid_to ?? momentNow()];
  const sql = constructFunctionQuery(db_fn_name, functionParams);
  const { result, error, isError } = await query(sql, errMsg, true);

  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, db_fn_name));
};

/**
 * @param idir
 * @param filte
 * @param page
 * @returns a list of collars that do not have a critter attached
 * currently no access control on these results
 */
const getAvailableCollarSql = function (
  idir: string,
  filter?: IFilter,
  page?: number
): string {
  const base = `select c.* from ${S_API}.collar_v c 
    where c.collar_id not in (
      select caa.collar_id from ${S_API}.collar_animal_assignment_v caa
      where caa.valid_to >= now() OR caa.valid_to IS null 
    )`;
  const strFilter = appendSqlFilter(
    filter || {},
    TelemetryTypes.collar,
    'c',
    true
  );
  const sql = constructGetQuery({
    base: base,
    filter: strFilter,
    order: 'c.device_id',
    page,
  });
  return sql;
};

const getAvailableCollars = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const idir = req.query?.idir as string;
  const page = (req.query?.page || 1) as number;
  const sql = getAvailableCollarSql(idir, filterFromRequestParams(req), page);
  const { result, error, isError } = await query(
    sql,
    'failed to retrieve available collars'
  );
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(result.rows);
};

/**
 * @param idir
 * @param filter
 * @param page
 * @returns a list of collars that have a critter attached.
 * access control is included, so the user will only see collars that have a critter
 * that they are allowed to view
 */
const getAssignedCollarSql = function (
  idir: string,
  filter?: IFilter,
  page?: number
): string {
  const base = `select caa.animal_id, c.*
  from ${S_API}.collar_v c inner join ${S_API}.collar_animal_assignment_v caa 
  on c.collar_id = caa.collar_id
  where caa.valid_to >= now() OR caa.valid_to IS null
  ${_accessCollarControl('c', idir)}`;
  const strFilter = appendSqlFilter(filter || {}, TelemetryTypes.collar, 'c');
  const sql = constructGetQuery({
    base: base,
    filter: strFilter,
    order: 'c.device_id',
    page,
  });
  return sql;
};

const getAssignedCollars = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const idir = req?.query?.idir as string;
  const page = (req.query?.page || 1) as number;
  const sql = getAssignedCollarSql(idir, filterFromRequestParams(req), page);
  const { result, error, isError } = await query(
    sql,
    'failed to retrieve assigned collars'
  );
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(result.rows);
};

/**
 * retrieves a history of changes made to a collar
 */
const getCollarChangeHistory = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const idir = req?.query?.idir as string;
  const collar_id = req.params?.collar_id;
  if (!collar_id || !idir) {
    return res.status(500).send(`collar_id and idir must be supplied in query`);
  }
  const sql = constructFunctionQuery(pg_get_collar_history, [idir, collar_id]);
  const { result, error, isError } = await query(
    sql,
    'failed to retrieve collar history'
  );
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, pg_get_collar_history));
};

export {
  addCollar,
  updateCollar,
  assignOrUnassignCritterCollar,
  getAssignedCollars,
  getAvailableCollars,
  getCollarChangeHistory,
};

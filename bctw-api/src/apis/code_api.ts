import { Request, Response } from 'express';
import { S_API } from '../constants';
import {
  constructFunctionQuery,
  getRowResults,
  query,
} from '../database/query';
import { getUserIdentifier } from '../database/requests';
import { createBulkResponse } from '../import/bulk_handlers';
import { IBulkResponse } from '../types/import_types';

const pg_get_code_fn = 'get_code';
const pg_add_code_header_fn = 'add_code_header';
const pg_add_code_fn = 'add_code';

/**
 * @param codeHeader - code_header_name of the codes to be retrieved
*/
const getCode = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const { codeHeader } = req.query;
  if (!codeHeader) {
    return res.status(500).send(`invalid code header name ${codeHeader}`);
  }
  const page = (req.query?.page || 0) as number;
  const sql = constructFunctionQuery('get_code', [getUserIdentifier(req), codeHeader, page], false, S_API);
  const { result, error, isError } = await query(
    sql,
    'failed to retrieve codes'
  );
  if (isError) {
    return res.status(500).send(error.message);
  }
  const results = getRowResults(result, pg_get_code_fn);
  return res.send(results);
};

/**
 * @param codeType optional param of code_header_name
 * @returns returns all codeHeaders unless codeType is supplied
 */
const getCodeHeaders = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const { codeType } = req.query;
  let sql = `select
    code_header_id as id,
    code_header_name as type,
    code_header_title as title,
    code_header_description as description
    from ${S_API}.code_header_v `;
  if (codeType) {
    sql += `where code_header_name = '${codeType}';`;
  }
  const { result, error, isError } = await query(
    sql,
    'failed to retrieve code headers'
  );
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(result.rows);
};

/* 
  - accepts json[] in the format:
  {
    code_header_name: '', code_header_title: '', code_header_description: '', valid_from: Date, valid_to: Date,
  }
*/
const addCodeHeader = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const bulkResp: IBulkResponse = { errors: [], results: [] };
  const headers = req.body;
  const sql = constructFunctionQuery('add_code_header', [getUserIdentifier(req), headers], true);
  const { result, error, isError } = await query(
    sql,
    'failed to add code headers',
    true
  );
  if (isError) {
    bulkResp.errors.push({ row: '', error: error.message, rownum: 0 });
  } else {
    createBulkResponse(
      bulkResp,
      getRowResults(result, pg_add_code_header_fn)
    );
  }
  return res.send(bulkResp);
};

/*
  - accepts json[] in format
   {
     "code_header": '', "code_type: '', code_name":'', "code_description":'', "code_sort_order: number, "valid_from": Date, "valid_to": Date
   }
*/
const addCode = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const { codes } = req.body;
  const bulkResp: IBulkResponse = { errors: [], results: [] };
  const sql = constructFunctionQuery(pg_add_code_fn, [getUserIdentifier(req), codes], true);
  const { result, error, isError } = await query(
    sql,
    'failed to add codes',
    true
  );
  if (isError) {
    bulkResp.errors.push({ row: '', error: error.message, rownum: 0 });
  } else {
    createBulkResponse(bulkResp, getRowResults(result, pg_add_code_fn));
  }
  return res.send(bulkResp);
};

export { getCode, getCodeHeaders, addCode, addCodeHeader };

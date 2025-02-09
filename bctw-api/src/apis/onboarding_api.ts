import { Request, Response } from 'express';
import { S_API } from '../constants';
import {
  constructFunctionQuery,
  constructGetQuery,
  getRowResults,
  query,
} from '../database/query';
import { getUserIdentifier, getUserIdentifierDomain } from '../database/requests';
import { userOnboardRequest } from '../templates/email_templates';
import { IHandleOnboardRequestInput, OnboardUserInput } from '../types/user';
import { sendEmail } from './email';

/**
 * handler for when a new user submits a request for access to BCTW
 */
const submitOnboardingRequest = async function (
  req: Request,
  res: Response
): Promise<Response> {
  const fn_name = 'submit_onboarding_request';
  const body: OnboardUserInput = req.body;
  const { user } = body;
  const sql = constructFunctionQuery(fn_name, [user]);
  const { result, error, isError } = await query(sql, undefined, true);
  if (isError) {
    return res.status(500).send(error.message);
  }
  sendEmail(userOnboardRequest(body), `Access request for the BC Telemetry Warehouse: ${user.username}`);
  return res.send(getRowResults(result, fn_name, true));
};

/**
 * handler for an admin to grant or deny a user request
 * @param {IHandleOnboardRequestInput}
 */
const handleOnboardingRequest = async function (
  req: Request,
  res: Response
): Promise<Response>{
  const fn_name = 'handle_onboarding_request';
  const { onboarding_id, access, role_type } = req.body as IHandleOnboardRequestInput;
  const sql = constructFunctionQuery(fn_name, [getUserIdentifier(req), onboarding_id, access, role_type]);
  const { result, error, isError } = await query(sql, undefined, true);
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(getRowResults(result, fn_name, true));
};

/**
 * retrieves all onboarding requests
 */
const getOnboardingRequests = async function (req: Request, res:Response): Promise<Response> {
  const base = `select * from ${S_API}.onboarding_v`;
  const { result, error, isError } = await query(constructGetQuery({base}));
  if (isError) {
    return res.status(500).send(error.message);
  }
  return res.send(result.rows);
};

/**
 * for onboarding purposes. Takes the domain and username and returns the status of onboarding.
 * returns an access object that has a @type {OnboardingStatus}
 */
const getUserOnboardStatus = async function (
  req: Request,
  res: Response
): Promise<Response> {
const [domain, identifier] = getUserIdentifierDomain(req);
const sql = `select access, email, valid_from, valid_to from bctw.onboarding where domain = '${domain}' and username = '${identifier}' order by valid_from desc limit 1`;
const { result, error, isError } = await query(sql);
// If there's an error return a 500, otherwise return the results
if (isError) {
  return res.status(500).send(error.message);
}
if (!result.rowCount) {
  return res.send(null);
}
return res.send(result.rows[0]);
}

export {
  getOnboardingRequests,
  getUserOnboardStatus,
  handleOnboardingRequest,
  submitOnboardingRequest,
};

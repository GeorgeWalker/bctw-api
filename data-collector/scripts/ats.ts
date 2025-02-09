import { retrieveCredentials } from './utils/credentials';
import { spawn } from 'child_process'

/** login form field IDs
 * can be supplied via environment variables
 * the Cypress process requires these element IDs to supply the login credentials
 * to the ATS login form
*/
const ATS_USERNAME_FIELD_ID = process.env.ATS_USERNAME_FIELD_ID || '#username';
const ATS_PASSWORD_FIELD_ID = process.env.ATS_PASSWORD_FIELD_ID || '#password';
const ATS_LOGIN_FORM_ID = process.env.ATS_LOGIN_FORM_ID || '#ctl01';

/**
 * spawn cypress as a child process, why? to pass the node environment variables
 * debugging note: additionally pass '--no-exit' when debugging locally to have Cypress not exit immediately
 */
const spawnProcess = async () => {
    // the row identifier in the encrypted table, passed as a parameter to retrieve credentials function
    const credential_name_id = process.env.ATS_API_CREDENTIAL_NAME;
    console.log('credential row identifier: ', credential_name_id)
    // retrieve the ATS credentials from the encrypted db table
    const { username, password, url } = await retrieveCredentials(credential_name_id ?? '');

    if (!url) {
        console.log(`unable to retrieve ATS API url using identifier ${credential_name_id}`);
        return;
    }
    console.log(`succesfully retrieved API credentials from database: ${username}, ${password}, ${url}`);

    const envString = `ATS_URL=${url},ATS_USERNAME_FIELD_ID=${ATS_USERNAME_FIELD_ID},ATS_PASSWORD_FIELD_ID=${ATS_PASSWORD_FIELD_ID},ATS_LOGIN_FORM_ID=${ATS_LOGIN_FORM_ID},ATS_PASSWORD=${password},ATS_USERNAME=${username}`;
    console.log(`environment variables passed to Cypress: ${envString}`);

    const cypress = spawn('cypress', ['run', '-b', 'chromium', '--headless', '--env', envString]);

    cypress.stdout.on('data', data => console.log(`stdout: ${data}`));
    cypress.stderr.on('data', data => console.log(`stderr: ${data}`));

    cypress.on('error', (error) => console.log(`error: ${error.message}`));
    cypress.on('close', code => console.log(`child process exited with code ${code}`));
}

spawnProcess();
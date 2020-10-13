import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import helmet from 'helmet';
import express from 'express';
import * as api from './start';
import { testxml } from './import/xml';

/* ## Server
  Run the server.
 */

const app = express()
  .use(helmet())
  .use(cors())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  // .post('/grant-collars', api.grantCollarAccess)
  .post('/add-user', api.addUser)
  .get('/get-critters',api.getDBCritters)
  .get('/get-last-pings',api.getLastPings)
  .get('/role',api.getUserRole)
  // .get('/user-collars', api.getUserCollars)
  .get('/xml', testxml)
  .get('*', api.notFound);

  
http.createServer(app).listen(3000, () => {
  console.log(`listening on port 3000`)
});

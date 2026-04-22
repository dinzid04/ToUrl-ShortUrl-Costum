import serverless from 'serverless-http';
import { app } from '../../server'; // Adjust this path so it points to server.ts properly

export const handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});

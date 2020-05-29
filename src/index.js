import * as  cron from 'node-cron';
import * as express from 'express';
import { runTask } from './task';
require('console-stamp')(console, '[HH:MM:ss.l]');

const cronExpression = process.env.CRON ? process.env.CRON : '* 24 * * * *';
const app = express();

cron.schedule(cronExpression, async() => {
    console.log("Starting de cleaning job");
    await runTask();
    console.log("Cleaning job finished with success")
});

app.listen('3128', () => {
  console.log('server is running on port: 3128');
});
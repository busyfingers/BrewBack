import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import passport from 'passport';
import { Strategy } from 'passport-http-bearer';
import * as users from './models/users';
import * as temperatureRouter from './routes/temperature';
import * as batchRouter from './routes/batchdata';

passport.use(
  new Strategy(async (token: string, cb: Function) => {
    try {
      const user = await users.getByToken(token);
      if (user) {
        return cb(null, user);
      }
      return cb(null, false);
    } catch (error) {
      return cb(error);
    }
  })
);

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/temperature', temperatureRouter.default);
app.use('/api/batchdata', batchRouter.default);
app.all('*', function (req, res) {
  res.sendStatus(404);
});

export default app;

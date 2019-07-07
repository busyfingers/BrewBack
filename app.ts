import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as logger from 'morgan';
import * as passport from 'passport';
import { Strategy } from 'passport-http-bearer';
import * as users from './src/models/users';

const temperatureRouter = require('./routes/temperature');

passport.use(
    new Strategy(async (token, cb) => {
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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/temperature', temperatureRouter);
app.all('*', function(req, res) {
    res.sendStatus(404);
});

module.exports = app;

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const bearerStrategy = require('passport-http-bearer').Strategy;
const users = require('./models/users');

const measurementsRouter = require('./routes/measurements');

passport.use(
    new bearerStrategy(async (token, cb) => {
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

app.use('/api/measurements', measurementsRouter);
app.all('*', function(req, res) {
    res.sendStatus(404);
});

module.exports = app;

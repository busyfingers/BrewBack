var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var bearerStrategy = require('passport-http-bearer').Strategy;
var users = require('./models/users');

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

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/measurements', measurementsRouter);

module.exports = app;

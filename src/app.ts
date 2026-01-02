import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import passport from 'passport';
import { Strategy } from 'passport-http-bearer';
import * as users from './models/users';
import * as temperatureRouter from './routes/temperature';
import * as batchRouter from './routes/batchdata';
import * as fermProfileRouter from './routes/fermentationProfile';
import { getDatabase, closeDatabase } from './database/database';
import { initializeDatabase } from './database/schema';
import * as config from './config/config';

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
app.use('/api/fermentationProfile', fermProfileRouter.default);
app.all('*', function (req, res) {
  res.sendStatus(404);
});

// Initialize database
function startServer() {
  try {
    // Set config values
    config.setConfigValues();

    // Initialize database connection (singleton)
    const db = getDatabase();

    // Initialize schema
    initializeDatabase(db);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  closeDatabase();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

export default app;

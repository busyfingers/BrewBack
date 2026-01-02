import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import * as users from './models/users';
import { createTemperatureRouter } from './routes/temperature';
import { createBatchDataRouter } from './routes/batchdata';
import { createFermentationProfileRouter } from './routes/fermentationProfile';
import { getDatabase, closeDatabase } from './database/database';
import { initializeDatabase } from './database/schema';
import { execQuery, execNonQuery } from './database/db';
import * as config from './config/config';

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// User lookup function for authentication
const getUserByToken = users.getByToken;

// Create routers with real database functions
app.use('/api/temperature', createTemperatureRouter(getUserByToken, execQuery, execNonQuery));
app.use('/api/batchdata', createBatchDataRouter(getUserByToken, execQuery, execNonQuery));
app.use('/api/fermentationProfile', createFermentationProfileRouter(getUserByToken, execQuery));

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

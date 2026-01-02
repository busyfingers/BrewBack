import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { UserRepository, TemperatureRepository, BatchRepository, FermentationProfileRepository } from './repositories';
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

// Create repositories with database functions
const userRepository = new UserRepository(execQuery);
const temperatureRepository = new TemperatureRepository(execQuery, execNonQuery);
const batchRepository = new BatchRepository(execQuery, execNonQuery);
const fermentationProfileRepository = new FermentationProfileRepository(execQuery, execNonQuery);

// User lookup function for authentication
const getUserByToken = (token: string) => userRepository.findByToken(token);

// Create routers with repositories
app.use('/api/temperature', createTemperatureRouter(getUserByToken, temperatureRepository));
app.use('/api/batchdata', createBatchDataRouter(getUserByToken, batchRepository, fermentationProfileRepository));
app.use('/api/fermentationProfile', createFermentationProfileRouter(getUserByToken, fermentationProfileRepository));

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

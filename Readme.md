# BrewBack

A custom-built backend for retrieving and serving sensor data related to beer brewing. The current implementation supports temperature readings from multiple sensors, e.g. wort and inside the fermentation chamber. It also supports integration with Brewfather (https://brewfather.app/).

Built on NodeJS with ExpressJS and uses SQL Server for storing data.

## Setup

- Install SQL Server (SQL Express works great).
- Install nodejs (https://nodejs.org/).
- Install TypeScript: `npm install -g typescipt` (more install options at: https://www.typescriptlang.org/download).
- Clone this repo.
- Run `npm install` to install the dependencies.
- Run the database scripts to setup the database and tables.
- Run `tsc` to compile the TypeScript. Creates a dist folder which is the deployment-ready application.
- Create a file called config.json (see section below for details) and put it in the root of the dist folder.
- Setup the initial database config (see section below for details).
- Run locally or deploy.
- Deploy (see section below for details).

## Config

```
{
  "dbServer": "", // name or IP of the database server
  "dbUser": "", // the database user (same as in the setup SQL script)
  "dbPass": "", // the database user password
  "dbName": "", // name of the database (same as in the setup SQL script)
  "dbPoolSize": 5, // the maximum number of concurrent connections
  "dbPoolGetTimeout": 3000, // how long to try to get a connection from the pool, in milliseconds
  "dbPoolRetryInterval": 50, // how long to wait before each retry, number of retries is dbPoolGetTimeout / dbPoolRetryInterval
  "batchDataApiKey": "" // used for Brewfather integration, this must be the value of 'author' in the recipe
}
```

## Routes

| Route                    | Method | Auth required | Description                                                                                   |
| ------------------------ | ------ | ------------- | --------------------------------------------------------------------------------------------- |
| /api/temperature         | GET    | Yes           | Retreives temperature info for a given time period                                            |
| /api/batchdata           | GET    | Yes           | Retrieves Id, batch number, recipe name, fermentation start, fermentation end for all batches |
| /api/batchdata           | POST   | No\*          | Recieves batch data from Brewfather                                                           |
| /api/fermentationProfile | GET    | Yes           | Retrieves fermentation profile info                                                           |

<br />

\* _Brewfather has no support for authentication. Therefore, the `author` in the request payload is used as a validation token. Also, since we cannot PUT to this route, the data is updated if the same batch already exists_

## Request format

### /api/temperature

The request body must be a JSON object with at least the following properties:

value = the temperature reading
measuredAt = the measurement time in epoch format
location = the location of the sensor

And optionally also:
sensorName = the name of the sensor, must match the sensor name stored in the database (see section "Database")
fermentorName = the name of the fermentor where the measurement was taken, must match the fermentor name stored in the database (see section "Database")

Example:

```
{
    "value": 11.23,
    "measuredAt": 1600545934000,
    "location": "Bucket",
    "sensorName": "S0123", // optional
    "fermenatorName": "Tank_02" // optional
}
```

## /api/batchdata - GET

No request body needed

## /api/batchdata - GET

The querystring must contain `batchId` with a value equal to the batch to get the data for.

Example: https://brewback.myurl.com/api/batchdata?batchId=42

## Authentication

For routes that require authentication, a bearer token is required in the request. The authentication mechanism is simplified intentionally, the client needs to know the token - it does not need to make an authentication request and be issued a new token first. (This should probably be improved)

## Brewfather integration

Since there is no support for authentication via Brewfather, the `author` of the recipe is used as an API key (the payload from Brewfather contains the entire recipe). The `Brewer` name must be a valid fermentor name (fermentor names are setup in the database), this is to support multiple fermentation chambers.

## Database

In order for the backend to work, some initial config is required:

- Users table: Create a user with a token that is active
- (if using Brewfather integration) Fermentors table: create at least one row. I Brewfather, set the `Brewer` field in a batch to the same value as the fermentor name.
- (optional) Sensors table: register your sensors to be able to map the readings to them when POSTing values.

## Deploy

Run deploy.sh or perform the same steps manually. Basically, copy the dist folder and config.json to a server where the app should be hosted.

## Creating measurements

Check out FermSense - https://github.com/busyfingers/FermSense - a temperature measurement script written in Python that sends the data to this API.

## Visualizing the data

Check out FermWatch - https://github.com/busyfingers/FermWatch - an app built in Dash (Python) that reads data from this API.

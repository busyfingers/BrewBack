USE master
GO
IF NOT EXISTS (
   SELECT name
   FROM sys.databases
   WHERE name = N'BrewBack_DEV'
)
   CREATE DATABASE [BrewBack_DEV];
GO
IF SERVERPROPERTY('ProductVersion') > '12'
    ALTER DATABASE [BrewBack_DEV] SET QUERY_STORE=ON;
GO
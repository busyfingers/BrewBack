CREATE LOGIN brewback WITH PASSWORD = ''
GO

USE BrewBack_DEV
CREATE USER bb_measurements FOR LOGIN brewback
GO

GRANT SELECT ON dbo.Measurements TO bb_measurements
GO

GRANT INSERT ON dbo.Measurements TO bb_measurements
GO
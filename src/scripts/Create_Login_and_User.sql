CREATE LOGIN brewback WITH PASSWORD = ''
GO

USE BrewBack_DEV
CREATE USER bb_measurements FOR LOGIN brewback
GO

GRANT SELECT ON dbo.Temperature TO bb_measurements
GO

GRANT INSERT ON dbo.Temperature TO bb_measurements
GO

GRANT SELECT ON dbo.Users TO bb_measurements
GO
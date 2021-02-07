CREATE TABLE [dbo].[Users]
(
	Id int PRIMARY KEY IDENTITY(1,1) NOT NULL,
	[Name] nvarchar(20) NOT NULL,
	Token nvarchar(100) NOT NULL,
	Active bit NOT NULL
);
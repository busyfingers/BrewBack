CREATE TABLE dbo.Batches (
    Id INT PRIMARY KEY IDENTITY(1,1),
    BatchNo INT NOT NULL,
    [RecipeName] NVARCHAR(150) NOT NULL,
    FermentorId INT NOT NULL,
    FermentationStart DATETIME NOT NULL,
    FermentationEnd DATETIME
)
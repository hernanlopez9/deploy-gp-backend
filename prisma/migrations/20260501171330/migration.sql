BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'HumanResources') EXEC sp_executesql N'CREATE SCHEMA [HumanResources];';

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'Person') EXEC sp_executesql N'CREATE SCHEMA [Person];';

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'Production') EXEC sp_executesql N'CREATE SCHEMA [Production];';

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'Purchasing') EXEC sp_executesql N'CREATE SCHEMA [Purchasing];';

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'Sales') EXEC sp_executesql N'CREATE SCHEMA [Sales];';

-- CreateTable
CREATE TABLE [Person].[Address] (
    [AddressID] INT NOT NULL IDENTITY(1,1),
    [AddressLine1] NVARCHAR(60) NOT NULL,
    [AddressLine2] NVARCHAR(60),
    [City] NVARCHAR(30) NOT NULL,
    [StateProvinceID] INT NOT NULL,
    [PostalCode] NVARCHAR(15) NOT NULL,
    [SpatialLocation] geography,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Address_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Address_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Address_AddressID] PRIMARY KEY CLUSTERED ([AddressID]),
    CONSTRAINT [AK_Address_rowguid] UNIQUE NONCLUSTERED ([rowguid]),
    CONSTRAINT [IX_Address_AddressLine1_AddressLine2_City_StateProvinceID_PostalCode] UNIQUE NONCLUSTERED ([AddressLine1],[AddressLine2],[City],[StateProvinceID],[PostalCode])
);

-- CreateTable
CREATE TABLE [Person].[AddressType] (
    [AddressTypeID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_AddressType_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_AddressType_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_AddressType_AddressTypeID] PRIMARY KEY CLUSTERED ([AddressTypeID]),
    CONSTRAINT [AK_AddressType_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_AddressType_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [dbo].[AWBuildVersion] (
    [SystemInformationID] TINYINT NOT NULL IDENTITY(1,1),
    [Database Version] NVARCHAR(25) NOT NULL,
    [VersionDate] DATETIME NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_AWBuildVersion_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_AWBuildVersion_SystemInformationID] PRIMARY KEY CLUSTERED ([SystemInformationID])
);

-- CreateTable
CREATE TABLE [Production].[BillOfMaterials] (
    [BillOfMaterialsID] INT NOT NULL IDENTITY(1,1),
    [ProductAssemblyID] INT,
    [ComponentID] INT NOT NULL,
    [StartDate] DATETIME NOT NULL CONSTRAINT [DF_BillOfMaterials_StartDate] DEFAULT CURRENT_TIMESTAMP,
    [EndDate] DATETIME,
    [UnitMeasureCode] NCHAR(3) NOT NULL,
    [BOMLevel] SMALLINT NOT NULL,
    [PerAssemblyQty] DECIMAL(8,2) NOT NULL CONSTRAINT [DF_BillOfMaterials_PerAssemblyQty] DEFAULT 1.00,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_BillOfMaterials_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_BillOfMaterials_BillOfMaterialsID] PRIMARY KEY NONCLUSTERED ([BillOfMaterialsID]),
    CONSTRAINT [AK_BillOfMaterials_ProductAssemblyID_ComponentID_StartDate] UNIQUE CLUSTERED ([ProductAssemblyID],[ComponentID],[StartDate])
);

-- CreateTable
CREATE TABLE [Person].[BusinessEntity] (
    [BusinessEntityID] INT NOT NULL IDENTITY(1,1),
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_BusinessEntity_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_BusinessEntity_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_BusinessEntity_BusinessEntityID] PRIMARY KEY CLUSTERED ([BusinessEntityID]),
    CONSTRAINT [AK_BusinessEntity_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Person].[BusinessEntityAddress] (
    [BusinessEntityID] INT NOT NULL,
    [AddressID] INT NOT NULL,
    [AddressTypeID] INT NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_BusinessEntityAddress_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_BusinessEntityAddress_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_BusinessEntityAddress_BusinessEntityID_AddressID_AddressTypeID] PRIMARY KEY CLUSTERED ([BusinessEntityID],[AddressID],[AddressTypeID]),
    CONSTRAINT [AK_BusinessEntityAddress_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Person].[BusinessEntityContact] (
    [BusinessEntityID] INT NOT NULL,
    [PersonID] INT NOT NULL,
    [ContactTypeID] INT NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_BusinessEntityContact_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_BusinessEntityContact_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_BusinessEntityContact_BusinessEntityID_PersonID_ContactTypeID] PRIMARY KEY CLUSTERED ([BusinessEntityID],[PersonID],[ContactTypeID]),
    CONSTRAINT [AK_BusinessEntityContact_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Person].[ContactType] (
    [ContactTypeID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ContactType_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ContactType_ContactTypeID] PRIMARY KEY CLUSTERED ([ContactTypeID]),
    CONSTRAINT [AK_ContactType_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [Person].[CountryRegion] (
    [CountryRegionCode] NVARCHAR(3) NOT NULL,
    [Name] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_CountryRegion_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_CountryRegion_CountryRegionCode] PRIMARY KEY CLUSTERED ([CountryRegionCode]),
    CONSTRAINT [AK_CountryRegion_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [Sales].[CountryRegionCurrency] (
    [CountryRegionCode] NVARCHAR(3) NOT NULL,
    [CurrencyCode] NCHAR(3) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_CountryRegionCurrency_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_CountryRegionCurrency_CountryRegionCode_CurrencyCode] PRIMARY KEY CLUSTERED ([CountryRegionCode],[CurrencyCode])
);

-- CreateTable
CREATE TABLE [Sales].[CreditCard] (
    [CreditCardID] INT NOT NULL IDENTITY(1,1),
    [CardType] NVARCHAR(50) NOT NULL,
    [CardNumber] NVARCHAR(25) NOT NULL,
    [ExpMonth] TINYINT NOT NULL,
    [ExpYear] SMALLINT NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_CreditCard_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_CreditCard_CreditCardID] PRIMARY KEY CLUSTERED ([CreditCardID]),
    CONSTRAINT [AK_CreditCard_CardNumber] UNIQUE NONCLUSTERED ([CardNumber])
);

-- CreateTable
CREATE TABLE [Production].[Culture] (
    [CultureID] NCHAR(6) NOT NULL,
    [Name] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Culture_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Culture_CultureID] PRIMARY KEY CLUSTERED ([CultureID]),
    CONSTRAINT [AK_Culture_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [Sales].[Currency] (
    [CurrencyCode] NCHAR(3) NOT NULL,
    [Name] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Currency_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Currency_CurrencyCode] PRIMARY KEY CLUSTERED ([CurrencyCode]),
    CONSTRAINT [AK_Currency_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [Sales].[CurrencyRate] (
    [CurrencyRateID] INT NOT NULL IDENTITY(1,1),
    [CurrencyRateDate] DATETIME NOT NULL,
    [FromCurrencyCode] NCHAR(3) NOT NULL,
    [ToCurrencyCode] NCHAR(3) NOT NULL,
    [AverageRate] MONEY NOT NULL,
    [EndOfDayRate] MONEY NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_CurrencyRate_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_CurrencyRate_CurrencyRateID] PRIMARY KEY CLUSTERED ([CurrencyRateID]),
    CONSTRAINT [AK_CurrencyRate_CurrencyRateDate_FromCurrencyCode_ToCurrencyCode] UNIQUE NONCLUSTERED ([CurrencyRateDate],[FromCurrencyCode],[ToCurrencyCode])
);

-- CreateTable
CREATE TABLE [Sales].[Customer] (
    [CustomerID] INT NOT NULL IDENTITY(1,1),
    [PersonID] INT,
    [StoreID] INT,
    [TerritoryID] INT,
    [AccountNumber] VARCHAR(10) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Customer_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Customer_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Customer_CustomerID] PRIMARY KEY CLUSTERED ([CustomerID]),
    CONSTRAINT [AK_Customer_AccountNumber] UNIQUE NONCLUSTERED ([AccountNumber]),
    CONSTRAINT [AK_Customer_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [dbo].[DatabaseLog] (
    [DatabaseLogID] INT NOT NULL IDENTITY(1,1),
    [PostTime] DATETIME NOT NULL,
    [DatabaseUser] NVARCHAR(128) NOT NULL,
    [Event] NVARCHAR(128) NOT NULL,
    [Schema] NVARCHAR(128),
    [Object] NVARCHAR(128),
    [TSQL] NVARCHAR(max) NOT NULL,
    [XmlEvent] XML NOT NULL,
    CONSTRAINT [PK_DatabaseLog_DatabaseLogID] PRIMARY KEY NONCLUSTERED ([DatabaseLogID])
);

-- CreateTable
CREATE TABLE [HumanResources].[Department] (
    [DepartmentID] SMALLINT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [GroupName] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Department_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Department_DepartmentID] PRIMARY KEY CLUSTERED ([DepartmentID]),
    CONSTRAINT [AK_Department_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [Production].[Document] (
    [DocumentNode] hierarchyid NOT NULL,
    [DocumentLevel] SMALLINT,
    [Title] NVARCHAR(50) NOT NULL,
    [Owner] INT NOT NULL,
    [FolderFlag] BIT NOT NULL CONSTRAINT [DF_Document_FolderFlag] DEFAULT 0,
    [FileName] NVARCHAR(400) NOT NULL,
    [FileExtension] NVARCHAR(8) NOT NULL,
    [Revision] NCHAR(5) NOT NULL,
    [ChangeNumber] INT NOT NULL CONSTRAINT [DF_Document_ChangeNumber] DEFAULT 0,
    [Status] TINYINT NOT NULL,
    [DocumentSummary] NVARCHAR(max),
    [Document] VARBINARY(max),
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Document_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Document_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Document_DocumentNode] PRIMARY KEY CLUSTERED ([DocumentNode]),
    CONSTRAINT [AK_Document_rowguid] UNIQUE NONCLUSTERED ([rowguid]),
    CONSTRAINT [AK_Document_DocumentLevel_DocumentNode] UNIQUE NONCLUSTERED ([DocumentLevel],[DocumentNode])
);

-- CreateTable
CREATE TABLE [Person].[EmailAddress] (
    [BusinessEntityID] INT NOT NULL,
    [EmailAddressID] INT NOT NULL IDENTITY(1,1),
    [EmailAddress] NVARCHAR(50),
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_EmailAddress_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_EmailAddress_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_EmailAddress_BusinessEntityID_EmailAddressID] PRIMARY KEY CLUSTERED ([BusinessEntityID],[EmailAddressID])
);

-- CreateTable
CREATE TABLE [HumanResources].[Employee] (
    [BusinessEntityID] INT NOT NULL,
    [NationalIDNumber] NVARCHAR(15) NOT NULL,
    [LoginID] NVARCHAR(256) NOT NULL,
    [OrganizationNode] hierarchyid,
    [OrganizationLevel] SMALLINT,
    [JobTitle] NVARCHAR(50) NOT NULL,
    [BirthDate] DATE NOT NULL,
    [MaritalStatus] NCHAR(1) NOT NULL,
    [Gender] NCHAR(1) NOT NULL,
    [HireDate] DATE NOT NULL,
    [SalariedFlag] BIT NOT NULL CONSTRAINT [DF_Employee_SalariedFlag] DEFAULT 1,
    [VacationHours] SMALLINT NOT NULL CONSTRAINT [DF_Employee_VacationHours] DEFAULT 0,
    [SickLeaveHours] SMALLINT NOT NULL CONSTRAINT [DF_Employee_SickLeaveHours] DEFAULT 0,
    [CurrentFlag] BIT NOT NULL CONSTRAINT [DF_Employee_CurrentFlag] DEFAULT 1,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Employee_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Employee_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Employee_BusinessEntityID] PRIMARY KEY CLUSTERED ([BusinessEntityID]),
    CONSTRAINT [AK_Employee_NationalIDNumber] UNIQUE NONCLUSTERED ([NationalIDNumber]),
    CONSTRAINT [AK_Employee_LoginID] UNIQUE NONCLUSTERED ([LoginID]),
    CONSTRAINT [AK_Employee_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [HumanResources].[EmployeeDepartmentHistory] (
    [BusinessEntityID] INT NOT NULL,
    [DepartmentID] SMALLINT NOT NULL,
    [ShiftID] TINYINT NOT NULL,
    [StartDate] DATE NOT NULL,
    [EndDate] DATE,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_EmployeeDepartmentHistory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_EmployeeDepartmentHistory_BusinessEntityID_StartDate_DepartmentID] PRIMARY KEY CLUSTERED ([BusinessEntityID],[StartDate],[DepartmentID],[ShiftID])
);

-- CreateTable
CREATE TABLE [HumanResources].[EmployeePayHistory] (
    [BusinessEntityID] INT NOT NULL,
    [RateChangeDate] DATETIME NOT NULL,
    [Rate] MONEY NOT NULL,
    [PayFrequency] TINYINT NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_EmployeePayHistory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_EmployeePayHistory_BusinessEntityID_RateChangeDate] PRIMARY KEY CLUSTERED ([BusinessEntityID],[RateChangeDate])
);

-- CreateTable
CREATE TABLE [dbo].[ErrorLog] (
    [ErrorLogID] INT NOT NULL IDENTITY(1,1),
    [ErrorTime] DATETIME NOT NULL CONSTRAINT [DF_ErrorLog_ErrorTime] DEFAULT CURRENT_TIMESTAMP,
    [UserName] NVARCHAR(128) NOT NULL,
    [ErrorNumber] INT NOT NULL,
    [ErrorSeverity] INT,
    [ErrorState] INT,
    [ErrorProcedure] NVARCHAR(126),
    [ErrorLine] INT,
    [ErrorMessage] NVARCHAR(4000) NOT NULL,
    CONSTRAINT [PK_ErrorLog_ErrorLogID] PRIMARY KEY CLUSTERED ([ErrorLogID])
);

-- CreateTable
CREATE TABLE [Production].[Illustration] (
    [IllustrationID] INT NOT NULL IDENTITY(1,1),
    [Diagram] XML,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Illustration_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Illustration_IllustrationID] PRIMARY KEY CLUSTERED ([IllustrationID])
);

-- CreateTable
CREATE TABLE [HumanResources].[JobCandidate] (
    [JobCandidateID] INT NOT NULL IDENTITY(1,1),
    [BusinessEntityID] INT,
    [Resume] XML,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_JobCandidate_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_JobCandidate_JobCandidateID] PRIMARY KEY CLUSTERED ([JobCandidateID])
);

-- CreateTable
CREATE TABLE [Production].[Location] (
    [LocationID] SMALLINT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [CostRate] SMALLMONEY NOT NULL CONSTRAINT [DF_Location_CostRate] DEFAULT 0.00,
    [Availability] DECIMAL(8,2) NOT NULL CONSTRAINT [DF_Location_Availability] DEFAULT 0.00,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Location_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Location_LocationID] PRIMARY KEY CLUSTERED ([LocationID]),
    CONSTRAINT [AK_Location_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [Person].[Password] (
    [BusinessEntityID] INT NOT NULL,
    [PasswordHash] VARCHAR(128) NOT NULL,
    [PasswordSalt] VARCHAR(10) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Password_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Password_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Password_BusinessEntityID] PRIMARY KEY CLUSTERED ([BusinessEntityID])
);

-- CreateTable
CREATE TABLE [Person].[Person] (
    [BusinessEntityID] INT NOT NULL,
    [PersonType] NCHAR(2) NOT NULL,
    [NameStyle] BIT NOT NULL CONSTRAINT [DF_Person_NameStyle] DEFAULT 0,
    [Title] NVARCHAR(8),
    [FirstName] NVARCHAR(50) NOT NULL,
    [MiddleName] NVARCHAR(50),
    [LastName] NVARCHAR(50) NOT NULL,
    [Suffix] NVARCHAR(10),
    [EmailPromotion] INT NOT NULL CONSTRAINT [DF_Person_EmailPromotion] DEFAULT 0,
    [AdditionalContactInfo] XML,
    [Demographics] XML,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Person_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Person_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Person_BusinessEntityID] PRIMARY KEY CLUSTERED ([BusinessEntityID]),
    CONSTRAINT [AK_Person_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[PersonCreditCard] (
    [BusinessEntityID] INT NOT NULL,
    [CreditCardID] INT NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_PersonCreditCard_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_PersonCreditCard_BusinessEntityID_CreditCardID] PRIMARY KEY CLUSTERED ([BusinessEntityID],[CreditCardID])
);

-- CreateTable
CREATE TABLE [Person].[PersonPhone] (
    [BusinessEntityID] INT NOT NULL,
    [PhoneNumber] NVARCHAR(25) NOT NULL,
    [PhoneNumberTypeID] INT NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_PersonPhone_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_PersonPhone_BusinessEntityID_PhoneNumber_PhoneNumberTypeID] PRIMARY KEY CLUSTERED ([BusinessEntityID],[PhoneNumber],[PhoneNumberTypeID])
);

-- CreateTable
CREATE TABLE [Person].[PhoneNumberType] (
    [PhoneNumberTypeID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_PhoneNumberType_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_PhoneNumberType_PhoneNumberTypeID] PRIMARY KEY CLUSTERED ([PhoneNumberTypeID])
);

-- CreateTable
CREATE TABLE [Production].[Product] (
    [ProductID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [ProductNumber] NVARCHAR(25) NOT NULL,
    [MakeFlag] BIT NOT NULL CONSTRAINT [DF_Product_MakeFlag] DEFAULT 1,
    [FinishedGoodsFlag] BIT NOT NULL CONSTRAINT [DF_Product_FinishedGoodsFlag] DEFAULT 1,
    [Color] NVARCHAR(15),
    [SafetyStockLevel] SMALLINT NOT NULL,
    [ReorderPoint] SMALLINT NOT NULL,
    [StandardCost] MONEY NOT NULL,
    [ListPrice] MONEY NOT NULL,
    [Size] NVARCHAR(5),
    [SizeUnitMeasureCode] NCHAR(3),
    [WeightUnitMeasureCode] NCHAR(3),
    [Weight] DECIMAL(8,2),
    [DaysToManufacture] INT NOT NULL,
    [ProductLine] NCHAR(2),
    [Class] NCHAR(2),
    [Style] NCHAR(2),
    [ProductSubcategoryID] INT,
    [ProductModelID] INT,
    [SellStartDate] DATETIME NOT NULL,
    [SellEndDate] DATETIME,
    [DiscontinuedDate] DATETIME,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Product_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Product_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Product_ProductID] PRIMARY KEY CLUSTERED ([ProductID]),
    CONSTRAINT [AK_Product_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_Product_ProductNumber] UNIQUE NONCLUSTERED ([ProductNumber]),
    CONSTRAINT [AK_Product_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Production].[ProductCategory] (
    [ProductCategoryID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ProductCategory_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductCategory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductCategory_ProductCategoryID] PRIMARY KEY CLUSTERED ([ProductCategoryID]),
    CONSTRAINT [AK_ProductCategory_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_ProductCategory_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Production].[ProductCostHistory] (
    [ProductID] INT NOT NULL,
    [StartDate] DATETIME NOT NULL,
    [EndDate] DATETIME,
    [StandardCost] MONEY NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductCostHistory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductCostHistory_ProductID_StartDate] PRIMARY KEY CLUSTERED ([ProductID],[StartDate])
);

-- CreateTable
CREATE TABLE [Production].[ProductDescription] (
    [ProductDescriptionID] INT NOT NULL IDENTITY(1,1),
    [Description] NVARCHAR(400) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ProductDescription_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductDescription_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductDescription_ProductDescriptionID] PRIMARY KEY CLUSTERED ([ProductDescriptionID]),
    CONSTRAINT [AK_ProductDescription_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Production].[ProductDocument] (
    [ProductID] INT NOT NULL,
    [DocumentNode] hierarchyid NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductDocument_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductDocument_ProductID_DocumentNode] PRIMARY KEY CLUSTERED ([ProductID],[DocumentNode])
);

-- CreateTable
CREATE TABLE [Production].[ProductInventory] (
    [ProductID] INT NOT NULL,
    [LocationID] SMALLINT NOT NULL,
    [Shelf] NVARCHAR(10) NOT NULL,
    [Bin] TINYINT NOT NULL,
    [Quantity] SMALLINT NOT NULL CONSTRAINT [DF_ProductInventory_Quantity] DEFAULT 0,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ProductInventory_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductInventory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductInventory_ProductID_LocationID] PRIMARY KEY CLUSTERED ([ProductID],[LocationID])
);

-- CreateTable
CREATE TABLE [Production].[ProductListPriceHistory] (
    [ProductID] INT NOT NULL,
    [StartDate] DATETIME NOT NULL,
    [EndDate] DATETIME,
    [ListPrice] MONEY NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductListPriceHistory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductListPriceHistory_ProductID_StartDate] PRIMARY KEY CLUSTERED ([ProductID],[StartDate])
);

-- CreateTable
CREATE TABLE [Production].[ProductModel] (
    [ProductModelID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [CatalogDescription] XML,
    [Instructions] XML,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ProductModel_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductModel_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductModel_ProductModelID] PRIMARY KEY CLUSTERED ([ProductModelID]),
    CONSTRAINT [AK_ProductModel_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_ProductModel_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Production].[ProductModelIllustration] (
    [ProductModelID] INT NOT NULL,
    [IllustrationID] INT NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductModelIllustration_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductModelIllustration_ProductModelID_IllustrationID] PRIMARY KEY CLUSTERED ([ProductModelID],[IllustrationID])
);

-- CreateTable
CREATE TABLE [Production].[ProductModelProductDescriptionCulture] (
    [ProductModelID] INT NOT NULL,
    [ProductDescriptionID] INT NOT NULL,
    [CultureID] NCHAR(6) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductModelProductDescriptionCulture_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductModelProductDescriptionCulture_ProductModelID_ProductDescriptionID_CultureID] PRIMARY KEY CLUSTERED ([ProductModelID],[ProductDescriptionID],[CultureID])
);

-- CreateTable
CREATE TABLE [Production].[ProductPhoto] (
    [ProductPhotoID] INT NOT NULL IDENTITY(1,1),
    [ThumbNailPhoto] VARBINARY(max),
    [ThumbnailPhotoFileName] NVARCHAR(50),
    [LargePhoto] VARBINARY(max),
    [LargePhotoFileName] NVARCHAR(50),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductPhoto_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductPhoto_ProductPhotoID] PRIMARY KEY CLUSTERED ([ProductPhotoID])
);

-- CreateTable
CREATE TABLE [Production].[ProductProductPhoto] (
    [ProductID] INT NOT NULL,
    [ProductPhotoID] INT NOT NULL,
    [Primary] BIT NOT NULL CONSTRAINT [DF_ProductProductPhoto_Primary] DEFAULT 0,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductProductPhoto_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductProductPhoto_ProductID_ProductPhotoID] PRIMARY KEY NONCLUSTERED ([ProductID],[ProductPhotoID])
);

-- CreateTable
CREATE TABLE [Production].[ProductReview] (
    [ProductReviewID] INT NOT NULL IDENTITY(1,1),
    [ProductID] INT NOT NULL,
    [ReviewerName] NVARCHAR(50) NOT NULL,
    [ReviewDate] DATETIME NOT NULL CONSTRAINT [DF_ProductReview_ReviewDate] DEFAULT CURRENT_TIMESTAMP,
    [EmailAddress] NVARCHAR(50) NOT NULL,
    [Rating] INT NOT NULL,
    [Comments] NVARCHAR(3850),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductReview_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductReview_ProductReviewID] PRIMARY KEY CLUSTERED ([ProductReviewID])
);

-- CreateTable
CREATE TABLE [Production].[ProductSubcategory] (
    [ProductSubcategoryID] INT NOT NULL IDENTITY(1,1),
    [ProductCategoryID] INT NOT NULL,
    [Name] NVARCHAR(50) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ProductSubcategory_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductSubcategory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductSubcategory_ProductSubcategoryID] PRIMARY KEY CLUSTERED ([ProductSubcategoryID]),
    CONSTRAINT [AK_ProductSubcategory_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_ProductSubcategory_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Purchasing].[ProductVendor] (
    [ProductID] INT NOT NULL,
    [BusinessEntityID] INT NOT NULL,
    [AverageLeadTime] INT NOT NULL,
    [StandardPrice] MONEY NOT NULL,
    [LastReceiptCost] MONEY,
    [LastReceiptDate] DATETIME,
    [MinOrderQty] INT NOT NULL,
    [MaxOrderQty] INT NOT NULL,
    [OnOrderQty] INT,
    [UnitMeasureCode] NCHAR(3) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ProductVendor_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ProductVendor_ProductID_BusinessEntityID] PRIMARY KEY CLUSTERED ([ProductID],[BusinessEntityID])
);

-- CreateTable
CREATE TABLE [Purchasing].[PurchaseOrderDetail] (
    [PurchaseOrderID] INT NOT NULL,
    [PurchaseOrderDetailID] INT NOT NULL IDENTITY(1,1),
    [DueDate] DATETIME NOT NULL,
    [OrderQty] SMALLINT NOT NULL,
    [ProductID] INT NOT NULL,
    [UnitPrice] MONEY NOT NULL,
    [LineTotal] MONEY NOT NULL,
    [ReceivedQty] DECIMAL(8,2) NOT NULL,
    [RejectedQty] DECIMAL(8,2) NOT NULL,
    [StockedQty] DECIMAL(9,2) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_PurchaseOrderDetail_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_PurchaseOrderDetail_PurchaseOrderID_PurchaseOrderDetailID] PRIMARY KEY CLUSTERED ([PurchaseOrderID],[PurchaseOrderDetailID])
);

-- CreateTable
CREATE TABLE [Purchasing].[PurchaseOrderHeader] (
    [PurchaseOrderID] INT NOT NULL IDENTITY(1,1),
    [RevisionNumber] TINYINT NOT NULL CONSTRAINT [DF_PurchaseOrderHeader_RevisionNumber] DEFAULT 0,
    [Status] TINYINT NOT NULL CONSTRAINT [DF_PurchaseOrderHeader_Status] DEFAULT 1,
    [EmployeeID] INT NOT NULL,
    [VendorID] INT NOT NULL,
    [ShipMethodID] INT NOT NULL,
    [OrderDate] DATETIME NOT NULL CONSTRAINT [DF_PurchaseOrderHeader_OrderDate] DEFAULT CURRENT_TIMESTAMP,
    [ShipDate] DATETIME,
    [SubTotal] MONEY NOT NULL CONSTRAINT [DF_PurchaseOrderHeader_SubTotal] DEFAULT 0.00,
    [TaxAmt] MONEY NOT NULL CONSTRAINT [DF_PurchaseOrderHeader_TaxAmt] DEFAULT 0.00,
    [Freight] MONEY NOT NULL CONSTRAINT [DF_PurchaseOrderHeader_Freight] DEFAULT 0.00,
    [TotalDue] MONEY NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_PurchaseOrderHeader_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_PurchaseOrderHeader_PurchaseOrderID] PRIMARY KEY CLUSTERED ([PurchaseOrderID])
);

-- CreateTable
CREATE TABLE [Sales].[SalesOrderDetail] (
    [SalesOrderID] INT NOT NULL,
    [SalesOrderDetailID] INT NOT NULL IDENTITY(1,1),
    [CarrierTrackingNumber] NVARCHAR(25),
    [OrderQty] SMALLINT NOT NULL,
    [ProductID] INT NOT NULL,
    [SpecialOfferID] INT NOT NULL,
    [UnitPrice] MONEY NOT NULL,
    [UnitPriceDiscount] MONEY NOT NULL CONSTRAINT [DF_SalesOrderDetail_UnitPriceDiscount] DEFAULT 0.0,
    [LineTotal] DECIMAL(38,6) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SalesOrderDetail_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesOrderDetail_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesOrderDetail_SalesOrderID_SalesOrderDetailID] PRIMARY KEY CLUSTERED ([SalesOrderID],[SalesOrderDetailID]),
    CONSTRAINT [AK_SalesOrderDetail_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[SalesOrderHeader] (
    [SalesOrderID] INT NOT NULL IDENTITY(1,1),
    [RevisionNumber] TINYINT NOT NULL CONSTRAINT [DF_SalesOrderHeader_RevisionNumber] DEFAULT 0,
    [OrderDate] DATETIME NOT NULL CONSTRAINT [DF_SalesOrderHeader_OrderDate] DEFAULT CURRENT_TIMESTAMP,
    [DueDate] DATETIME NOT NULL,
    [ShipDate] DATETIME,
    [Status] TINYINT NOT NULL CONSTRAINT [DF_SalesOrderHeader_Status] DEFAULT 1,
    [OnlineOrderFlag] BIT NOT NULL CONSTRAINT [DF_SalesOrderHeader_OnlineOrderFlag] DEFAULT 1,
    [SalesOrderNumber] NVARCHAR(25) NOT NULL,
    [PurchaseOrderNumber] NVARCHAR(25),
    [AccountNumber] NVARCHAR(15),
    [CustomerID] INT NOT NULL,
    [SalesPersonID] INT,
    [TerritoryID] INT,
    [BillToAddressID] INT NOT NULL,
    [ShipToAddressID] INT NOT NULL,
    [ShipMethodID] INT NOT NULL,
    [CreditCardID] INT,
    [CreditCardApprovalCode] VARCHAR(15),
    [CurrencyRateID] INT,
    [SubTotal] MONEY NOT NULL CONSTRAINT [DF_SalesOrderHeader_SubTotal] DEFAULT 0.00,
    [TaxAmt] MONEY NOT NULL CONSTRAINT [DF_SalesOrderHeader_TaxAmt] DEFAULT 0.00,
    [Freight] MONEY NOT NULL CONSTRAINT [DF_SalesOrderHeader_Freight] DEFAULT 0.00,
    [TotalDue] MONEY NOT NULL,
    [Comment] NVARCHAR(128),
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SalesOrderHeader_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesOrderHeader_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesOrderHeader_SalesOrderID] PRIMARY KEY CLUSTERED ([SalesOrderID]),
    CONSTRAINT [AK_SalesOrderHeader_SalesOrderNumber] UNIQUE NONCLUSTERED ([SalesOrderNumber]),
    CONSTRAINT [AK_SalesOrderHeader_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[SalesOrderHeaderSalesReason] (
    [SalesOrderID] INT NOT NULL,
    [SalesReasonID] INT NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesOrderHeaderSalesReason_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesOrderHeaderSalesReason_SalesOrderID_SalesReasonID] PRIMARY KEY CLUSTERED ([SalesOrderID],[SalesReasonID])
);

-- CreateTable
CREATE TABLE [Sales].[SalesPerson] (
    [BusinessEntityID] INT NOT NULL,
    [TerritoryID] INT,
    [SalesQuota] MONEY,
    [Bonus] MONEY NOT NULL CONSTRAINT [DF_SalesPerson_Bonus] DEFAULT 0.00,
    [CommissionPct] SMALLMONEY NOT NULL CONSTRAINT [DF_SalesPerson_CommissionPct] DEFAULT 0.00,
    [SalesYTD] MONEY NOT NULL CONSTRAINT [DF_SalesPerson_SalesYTD] DEFAULT 0.00,
    [SalesLastYear] MONEY NOT NULL CONSTRAINT [DF_SalesPerson_SalesLastYear] DEFAULT 0.00,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SalesPerson_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesPerson_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesPerson_BusinessEntityID] PRIMARY KEY CLUSTERED ([BusinessEntityID]),
    CONSTRAINT [AK_SalesPerson_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[SalesPersonQuotaHistory] (
    [BusinessEntityID] INT NOT NULL,
    [QuotaDate] DATETIME NOT NULL,
    [SalesQuota] MONEY NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SalesPersonQuotaHistory_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesPersonQuotaHistory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesPersonQuotaHistory_BusinessEntityID_QuotaDate] PRIMARY KEY CLUSTERED ([BusinessEntityID],[QuotaDate]),
    CONSTRAINT [AK_SalesPersonQuotaHistory_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[SalesReason] (
    [SalesReasonID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [ReasonType] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesReason_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesReason_SalesReasonID] PRIMARY KEY CLUSTERED ([SalesReasonID])
);

-- CreateTable
CREATE TABLE [Sales].[SalesTaxRate] (
    [SalesTaxRateID] INT NOT NULL IDENTITY(1,1),
    [StateProvinceID] INT NOT NULL,
    [TaxType] TINYINT NOT NULL,
    [TaxRate] SMALLMONEY NOT NULL CONSTRAINT [DF_SalesTaxRate_TaxRate] DEFAULT 0.00,
    [Name] NVARCHAR(50) NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SalesTaxRate_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesTaxRate_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesTaxRate_SalesTaxRateID] PRIMARY KEY CLUSTERED ([SalesTaxRateID]),
    CONSTRAINT [AK_SalesTaxRate_rowguid] UNIQUE NONCLUSTERED ([rowguid]),
    CONSTRAINT [AK_SalesTaxRate_StateProvinceID_TaxType] UNIQUE NONCLUSTERED ([StateProvinceID],[TaxType])
);

-- CreateTable
CREATE TABLE [Sales].[SalesTerritory] (
    [TerritoryID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [CountryRegionCode] NVARCHAR(3) NOT NULL,
    [Group] NVARCHAR(50) NOT NULL,
    [SalesYTD] MONEY NOT NULL CONSTRAINT [DF_SalesTerritory_SalesYTD] DEFAULT 0.00,
    [SalesLastYear] MONEY NOT NULL CONSTRAINT [DF_SalesTerritory_SalesLastYear] DEFAULT 0.00,
    [CostYTD] MONEY NOT NULL CONSTRAINT [DF_SalesTerritory_CostYTD] DEFAULT 0.00,
    [CostLastYear] MONEY NOT NULL CONSTRAINT [DF_SalesTerritory_CostLastYear] DEFAULT 0.00,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SalesTerritory_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesTerritory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesTerritory_TerritoryID] PRIMARY KEY CLUSTERED ([TerritoryID]),
    CONSTRAINT [AK_SalesTerritory_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_SalesTerritory_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[SalesTerritoryHistory] (
    [BusinessEntityID] INT NOT NULL,
    [TerritoryID] INT NOT NULL,
    [StartDate] DATETIME NOT NULL,
    [EndDate] DATETIME,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SalesTerritoryHistory_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SalesTerritoryHistory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SalesTerritoryHistory_BusinessEntityID_StartDate_TerritoryID] PRIMARY KEY CLUSTERED ([BusinessEntityID],[StartDate],[TerritoryID]),
    CONSTRAINT [AK_SalesTerritoryHistory_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Production].[ScrapReason] (
    [ScrapReasonID] SMALLINT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ScrapReason_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ScrapReason_ScrapReasonID] PRIMARY KEY CLUSTERED ([ScrapReasonID]),
    CONSTRAINT [AK_ScrapReason_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [HumanResources].[Shift] (
    [ShiftID] TINYINT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [StartTime] TIME NOT NULL,
    [EndTime] TIME NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Shift_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Shift_ShiftID] PRIMARY KEY CLUSTERED ([ShiftID]),
    CONSTRAINT [AK_Shift_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_Shift_StartTime_EndTime] UNIQUE NONCLUSTERED ([StartTime],[EndTime])
);

-- CreateTable
CREATE TABLE [Purchasing].[ShipMethod] (
    [ShipMethodID] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(50) NOT NULL,
    [ShipBase] MONEY NOT NULL CONSTRAINT [DF_ShipMethod_ShipBase] DEFAULT 0.00,
    [ShipRate] MONEY NOT NULL CONSTRAINT [DF_ShipMethod_ShipRate] DEFAULT 0.00,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_ShipMethod_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ShipMethod_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ShipMethod_ShipMethodID] PRIMARY KEY CLUSTERED ([ShipMethodID]),
    CONSTRAINT [AK_ShipMethod_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_ShipMethod_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[ShoppingCartItem] (
    [ShoppingCartItemID] INT NOT NULL IDENTITY(1,1),
    [ShoppingCartID] NVARCHAR(50) NOT NULL,
    [Quantity] INT NOT NULL CONSTRAINT [DF_ShoppingCartItem_Quantity] DEFAULT 1,
    [ProductID] INT NOT NULL,
    [DateCreated] DATETIME NOT NULL CONSTRAINT [DF_ShoppingCartItem_DateCreated] DEFAULT CURRENT_TIMESTAMP,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_ShoppingCartItem_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_ShoppingCartItem_ShoppingCartItemID] PRIMARY KEY CLUSTERED ([ShoppingCartItemID])
);

-- CreateTable
CREATE TABLE [Sales].[SpecialOffer] (
    [SpecialOfferID] INT NOT NULL IDENTITY(1,1),
    [Description] NVARCHAR(255) NOT NULL,
    [DiscountPct] SMALLMONEY NOT NULL CONSTRAINT [DF_SpecialOffer_DiscountPct] DEFAULT 0.00,
    [Type] NVARCHAR(50) NOT NULL,
    [Category] NVARCHAR(50) NOT NULL,
    [StartDate] DATETIME NOT NULL,
    [EndDate] DATETIME NOT NULL,
    [MinQty] INT NOT NULL CONSTRAINT [DF_SpecialOffer_MinQty] DEFAULT 0,
    [MaxQty] INT,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SpecialOffer_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SpecialOffer_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SpecialOffer_SpecialOfferID] PRIMARY KEY CLUSTERED ([SpecialOfferID]),
    CONSTRAINT [AK_SpecialOffer_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Sales].[SpecialOfferProduct] (
    [SpecialOfferID] INT NOT NULL,
    [ProductID] INT NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_SpecialOfferProduct_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_SpecialOfferProduct_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_SpecialOfferProduct_SpecialOfferID_ProductID] PRIMARY KEY CLUSTERED ([SpecialOfferID],[ProductID]),
    CONSTRAINT [AK_SpecialOfferProduct_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Person].[StateProvince] (
    [StateProvinceID] INT NOT NULL IDENTITY(1,1),
    [StateProvinceCode] NCHAR(3) NOT NULL,
    [CountryRegionCode] NVARCHAR(3) NOT NULL,
    [IsOnlyStateProvinceFlag] BIT NOT NULL CONSTRAINT [DF_StateProvince_IsOnlyStateProvinceFlag] DEFAULT 1,
    [Name] NVARCHAR(50) NOT NULL,
    [TerritoryID] INT NOT NULL,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_StateProvince_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_StateProvince_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_StateProvince_StateProvinceID] PRIMARY KEY CLUSTERED ([StateProvinceID]),
    CONSTRAINT [AK_StateProvince_Name] UNIQUE NONCLUSTERED ([Name]),
    CONSTRAINT [AK_StateProvince_rowguid] UNIQUE NONCLUSTERED ([rowguid]),
    CONSTRAINT [AK_StateProvince_StateProvinceCode_CountryRegionCode] UNIQUE NONCLUSTERED ([StateProvinceCode],[CountryRegionCode])
);

-- CreateTable
CREATE TABLE [Sales].[Store] (
    [BusinessEntityID] INT NOT NULL,
    [Name] NVARCHAR(50) NOT NULL,
    [SalesPersonID] INT,
    [Demographics] XML,
    [rowguid] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Store_rowguid] DEFAULT newid(),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Store_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Store_BusinessEntityID] PRIMARY KEY CLUSTERED ([BusinessEntityID]),
    CONSTRAINT [AK_Store_rowguid] UNIQUE NONCLUSTERED ([rowguid])
);

-- CreateTable
CREATE TABLE [Production].[TransactionHistory] (
    [TransactionID] INT NOT NULL IDENTITY(1,1),
    [ProductID] INT NOT NULL,
    [ReferenceOrderID] INT NOT NULL,
    [ReferenceOrderLineID] INT NOT NULL CONSTRAINT [DF_TransactionHistory_ReferenceOrderLineID] DEFAULT 0,
    [TransactionDate] DATETIME NOT NULL CONSTRAINT [DF_TransactionHistory_TransactionDate] DEFAULT CURRENT_TIMESTAMP,
    [TransactionType] NCHAR(1) NOT NULL,
    [Quantity] INT NOT NULL,
    [ActualCost] MONEY NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_TransactionHistory_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_TransactionHistory_TransactionID] PRIMARY KEY CLUSTERED ([TransactionID])
);

-- CreateTable
CREATE TABLE [Production].[TransactionHistoryArchive] (
    [TransactionID] INT NOT NULL,
    [ProductID] INT NOT NULL,
    [ReferenceOrderID] INT NOT NULL,
    [ReferenceOrderLineID] INT NOT NULL CONSTRAINT [DF_TransactionHistoryArchive_ReferenceOrderLineID] DEFAULT 0,
    [TransactionDate] DATETIME NOT NULL CONSTRAINT [DF_TransactionHistoryArchive_TransactionDate] DEFAULT CURRENT_TIMESTAMP,
    [TransactionType] NCHAR(1) NOT NULL,
    [Quantity] INT NOT NULL,
    [ActualCost] MONEY NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_TransactionHistoryArchive_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_TransactionHistoryArchive_TransactionID] PRIMARY KEY CLUSTERED ([TransactionID])
);

-- CreateTable
CREATE TABLE [Production].[UnitMeasure] (
    [UnitMeasureCode] NCHAR(3) NOT NULL,
    [Name] NVARCHAR(50) NOT NULL,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_UnitMeasure_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_UnitMeasure_UnitMeasureCode] PRIMARY KEY CLUSTERED ([UnitMeasureCode]),
    CONSTRAINT [AK_UnitMeasure_Name] UNIQUE NONCLUSTERED ([Name])
);

-- CreateTable
CREATE TABLE [Purchasing].[Vendor] (
    [BusinessEntityID] INT NOT NULL,
    [AccountNumber] NVARCHAR(15) NOT NULL,
    [Name] NVARCHAR(50) NOT NULL,
    [CreditRating] TINYINT NOT NULL,
    [PreferredVendorStatus] BIT NOT NULL CONSTRAINT [DF_Vendor_PreferredVendorStatus] DEFAULT 1,
    [ActiveFlag] BIT NOT NULL CONSTRAINT [DF_Vendor_ActiveFlag] DEFAULT 1,
    [PurchasingWebServiceURL] NVARCHAR(1024),
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_Vendor_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_Vendor_BusinessEntityID] PRIMARY KEY CLUSTERED ([BusinessEntityID]),
    CONSTRAINT [AK_Vendor_AccountNumber] UNIQUE NONCLUSTERED ([AccountNumber])
);

-- CreateTable
CREATE TABLE [Production].[WorkOrder] (
    [WorkOrderID] INT NOT NULL IDENTITY(1,1),
    [ProductID] INT NOT NULL,
    [OrderQty] INT NOT NULL,
    [StockedQty] INT NOT NULL,
    [ScrappedQty] SMALLINT NOT NULL,
    [StartDate] DATETIME NOT NULL,
    [EndDate] DATETIME,
    [DueDate] DATETIME NOT NULL,
    [ScrapReasonID] SMALLINT,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_WorkOrder_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_WorkOrder_WorkOrderID] PRIMARY KEY CLUSTERED ([WorkOrderID])
);

-- CreateTable
CREATE TABLE [Production].[WorkOrderRouting] (
    [WorkOrderID] INT NOT NULL,
    [ProductID] INT NOT NULL,
    [OperationSequence] SMALLINT NOT NULL,
    [LocationID] SMALLINT NOT NULL,
    [ScheduledStartDate] DATETIME NOT NULL,
    [ScheduledEndDate] DATETIME NOT NULL,
    [ActualStartDate] DATETIME,
    [ActualEndDate] DATETIME,
    [ActualResourceHrs] DECIMAL(9,4),
    [PlannedCost] MONEY NOT NULL,
    [ActualCost] MONEY,
    [ModifiedDate] DATETIME NOT NULL CONSTRAINT [DF_WorkOrderRouting_ModifiedDate] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PK_WorkOrderRouting_WorkOrderID_ProductID_OperationSequence] PRIMARY KEY CLUSTERED ([WorkOrderID],[ProductID],[OperationSequence])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [username] VARCHAR(50) NOT NULL,
    [email] VARCHAR(100) NOT NULL,
    [password] VARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Address_StateProvinceID] ON [Person].[Address]([StateProvinceID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BillOfMaterials_UnitMeasureCode] ON [Production].[BillOfMaterials]([UnitMeasureCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BusinessEntityAddress_AddressID] ON [Person].[BusinessEntityAddress]([AddressID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BusinessEntityAddress_AddressTypeID] ON [Person].[BusinessEntityAddress]([AddressTypeID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BusinessEntityContact_ContactTypeID] ON [Person].[BusinessEntityContact]([ContactTypeID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_BusinessEntityContact_PersonID] ON [Person].[BusinessEntityContact]([PersonID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_CountryRegionCurrency_CurrencyCode] ON [Sales].[CountryRegionCurrency]([CurrencyCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Customer_TerritoryID] ON [Sales].[Customer]([TerritoryID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Document_FileName_Revision] ON [Production].[Document]([FileName], [Revision]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_EmailAddress_EmailAddress] ON [Person].[EmailAddress]([EmailAddress]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Employee_OrganizationLevel_OrganizationNode] ON [HumanResources].[Employee]([OrganizationLevel], [OrganizationNode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Employee_OrganizationNode] ON [HumanResources].[Employee]([OrganizationNode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_EmployeeDepartmentHistory_DepartmentID] ON [HumanResources].[EmployeeDepartmentHistory]([DepartmentID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_EmployeeDepartmentHistory_ShiftID] ON [HumanResources].[EmployeeDepartmentHistory]([ShiftID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_JobCandidate_BusinessEntityID] ON [HumanResources].[JobCandidate]([BusinessEntityID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Person_LastName_FirstName_MiddleName] ON [Person].[Person]([LastName], [FirstName], [MiddleName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PersonPhone_PhoneNumber] ON [Person].[PersonPhone]([PhoneNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProductReview_ProductID_Name] ON [Production].[ProductReview]([ProductID], [ReviewerName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProductVendor_BusinessEntityID] ON [Purchasing].[ProductVendor]([BusinessEntityID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ProductVendor_UnitMeasureCode] ON [Purchasing].[ProductVendor]([UnitMeasureCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PurchaseOrderDetail_ProductID] ON [Purchasing].[PurchaseOrderDetail]([ProductID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PurchaseOrderHeader_EmployeeID] ON [Purchasing].[PurchaseOrderHeader]([EmployeeID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PurchaseOrderHeader_VendorID] ON [Purchasing].[PurchaseOrderHeader]([VendorID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_SalesOrderDetail_ProductID] ON [Sales].[SalesOrderDetail]([ProductID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_SalesOrderHeader_CustomerID] ON [Sales].[SalesOrderHeader]([CustomerID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_SalesOrderHeader_SalesPersonID] ON [Sales].[SalesOrderHeader]([SalesPersonID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_ShoppingCartItem_ShoppingCartID_ProductID] ON [Sales].[ShoppingCartItem]([ShoppingCartID], [ProductID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_SpecialOfferProduct_ProductID] ON [Sales].[SpecialOfferProduct]([ProductID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_Store_SalesPersonID] ON [Sales].[Store]([SalesPersonID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_TransactionHistory_ProductID] ON [Production].[TransactionHistory]([ProductID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_TransactionHistory_ReferenceOrderID_ReferenceOrderLineID] ON [Production].[TransactionHistory]([ReferenceOrderID], [ReferenceOrderLineID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_TransactionHistoryArchive_ProductID] ON [Production].[TransactionHistoryArchive]([ProductID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_TransactionHistoryArchive_ReferenceOrderID_ReferenceOrderLineID] ON [Production].[TransactionHistoryArchive]([ReferenceOrderID], [ReferenceOrderLineID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_WorkOrder_ProductID] ON [Production].[WorkOrder]([ProductID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_WorkOrder_ScrapReasonID] ON [Production].[WorkOrder]([ScrapReasonID]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_WorkOrderRouting_ProductID] ON [Production].[WorkOrderRouting]([ProductID]);

-- AddForeignKey
ALTER TABLE [Person].[Address] ADD CONSTRAINT [FK_Address_StateProvince_StateProvinceID] FOREIGN KEY ([StateProvinceID]) REFERENCES [Person].[StateProvince]([StateProvinceID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[BillOfMaterials] ADD CONSTRAINT [FK_BillOfMaterials_Product_ComponentID] FOREIGN KEY ([ComponentID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[BillOfMaterials] ADD CONSTRAINT [FK_BillOfMaterials_Product_ProductAssemblyID] FOREIGN KEY ([ProductAssemblyID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[BillOfMaterials] ADD CONSTRAINT [FK_BillOfMaterials_UnitMeasure_UnitMeasureCode] FOREIGN KEY ([UnitMeasureCode]) REFERENCES [Production].[UnitMeasure]([UnitMeasureCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[BusinessEntityAddress] ADD CONSTRAINT [FK_BusinessEntityAddress_Address_AddressID] FOREIGN KEY ([AddressID]) REFERENCES [Person].[Address]([AddressID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[BusinessEntityAddress] ADD CONSTRAINT [FK_BusinessEntityAddress_AddressType_AddressTypeID] FOREIGN KEY ([AddressTypeID]) REFERENCES [Person].[AddressType]([AddressTypeID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[BusinessEntityAddress] ADD CONSTRAINT [FK_BusinessEntityAddress_BusinessEntity_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[BusinessEntity]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[BusinessEntityContact] ADD CONSTRAINT [FK_BusinessEntityContact_BusinessEntity_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[BusinessEntity]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[BusinessEntityContact] ADD CONSTRAINT [FK_BusinessEntityContact_ContactType_ContactTypeID] FOREIGN KEY ([ContactTypeID]) REFERENCES [Person].[ContactType]([ContactTypeID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[BusinessEntityContact] ADD CONSTRAINT [FK_BusinessEntityContact_Person_PersonID] FOREIGN KEY ([PersonID]) REFERENCES [Person].[Person]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[CountryRegionCurrency] ADD CONSTRAINT [FK_CountryRegionCurrency_CountryRegion_CountryRegionCode] FOREIGN KEY ([CountryRegionCode]) REFERENCES [Person].[CountryRegion]([CountryRegionCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[CountryRegionCurrency] ADD CONSTRAINT [FK_CountryRegionCurrency_Currency_CurrencyCode] FOREIGN KEY ([CurrencyCode]) REFERENCES [Sales].[Currency]([CurrencyCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[CurrencyRate] ADD CONSTRAINT [FK_CurrencyRate_Currency_FromCurrencyCode] FOREIGN KEY ([FromCurrencyCode]) REFERENCES [Sales].[Currency]([CurrencyCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[CurrencyRate] ADD CONSTRAINT [FK_CurrencyRate_Currency_ToCurrencyCode] FOREIGN KEY ([ToCurrencyCode]) REFERENCES [Sales].[Currency]([CurrencyCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[Customer] ADD CONSTRAINT [FK_Customer_Person_PersonID] FOREIGN KEY ([PersonID]) REFERENCES [Person].[Person]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[Customer] ADD CONSTRAINT [FK_Customer_SalesTerritory_TerritoryID] FOREIGN KEY ([TerritoryID]) REFERENCES [Sales].[SalesTerritory]([TerritoryID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[Customer] ADD CONSTRAINT [FK_Customer_Store_StoreID] FOREIGN KEY ([StoreID]) REFERENCES [Sales].[Store]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[Document] ADD CONSTRAINT [FK_Document_Employee_Owner] FOREIGN KEY ([Owner]) REFERENCES [HumanResources].[Employee]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[EmailAddress] ADD CONSTRAINT [FK_EmailAddress_Person_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[Person]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [HumanResources].[Employee] ADD CONSTRAINT [FK_Employee_Person_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[Person]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [HumanResources].[EmployeeDepartmentHistory] ADD CONSTRAINT [FK_EmployeeDepartmentHistory_Department_DepartmentID] FOREIGN KEY ([DepartmentID]) REFERENCES [HumanResources].[Department]([DepartmentID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [HumanResources].[EmployeeDepartmentHistory] ADD CONSTRAINT [FK_EmployeeDepartmentHistory_Employee_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [HumanResources].[Employee]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [HumanResources].[EmployeeDepartmentHistory] ADD CONSTRAINT [FK_EmployeeDepartmentHistory_Shift_ShiftID] FOREIGN KEY ([ShiftID]) REFERENCES [HumanResources].[Shift]([ShiftID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [HumanResources].[EmployeePayHistory] ADD CONSTRAINT [FK_EmployeePayHistory_Employee_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [HumanResources].[Employee]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [HumanResources].[JobCandidate] ADD CONSTRAINT [FK_JobCandidate_Employee_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [HumanResources].[Employee]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[Password] ADD CONSTRAINT [FK_Password_Person_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[Person]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[Person] ADD CONSTRAINT [FK_Person_BusinessEntity_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[BusinessEntity]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[PersonCreditCard] ADD CONSTRAINT [FK_PersonCreditCard_CreditCard_CreditCardID] FOREIGN KEY ([CreditCardID]) REFERENCES [Sales].[CreditCard]([CreditCardID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[PersonCreditCard] ADD CONSTRAINT [FK_PersonCreditCard_Person_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[Person]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[PersonPhone] ADD CONSTRAINT [FK_PersonPhone_Person_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[Person]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[PersonPhone] ADD CONSTRAINT [FK_PersonPhone_PhoneNumberType_PhoneNumberTypeID] FOREIGN KEY ([PhoneNumberTypeID]) REFERENCES [Person].[PhoneNumberType]([PhoneNumberTypeID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[Product] ADD CONSTRAINT [FK_Product_ProductModel_ProductModelID] FOREIGN KEY ([ProductModelID]) REFERENCES [Production].[ProductModel]([ProductModelID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[Product] ADD CONSTRAINT [FK_Product_ProductSubcategory_ProductSubcategoryID] FOREIGN KEY ([ProductSubcategoryID]) REFERENCES [Production].[ProductSubcategory]([ProductSubcategoryID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[Product] ADD CONSTRAINT [FK_Product_UnitMeasure_SizeUnitMeasureCode] FOREIGN KEY ([SizeUnitMeasureCode]) REFERENCES [Production].[UnitMeasure]([UnitMeasureCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[Product] ADD CONSTRAINT [FK_Product_UnitMeasure_WeightUnitMeasureCode] FOREIGN KEY ([WeightUnitMeasureCode]) REFERENCES [Production].[UnitMeasure]([UnitMeasureCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductCostHistory] ADD CONSTRAINT [FK_ProductCostHistory_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductDocument] ADD CONSTRAINT [FK_ProductDocument_Document_DocumentNode] FOREIGN KEY ([DocumentNode]) REFERENCES [Production].[Document]([DocumentNode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductDocument] ADD CONSTRAINT [FK_ProductDocument_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductInventory] ADD CONSTRAINT [FK_ProductInventory_Location_LocationID] FOREIGN KEY ([LocationID]) REFERENCES [Production].[Location]([LocationID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductInventory] ADD CONSTRAINT [FK_ProductInventory_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductListPriceHistory] ADD CONSTRAINT [FK_ProductListPriceHistory_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductModelIllustration] ADD CONSTRAINT [FK_ProductModelIllustration_Illustration_IllustrationID] FOREIGN KEY ([IllustrationID]) REFERENCES [Production].[Illustration]([IllustrationID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductModelIllustration] ADD CONSTRAINT [FK_ProductModelIllustration_ProductModel_ProductModelID] FOREIGN KEY ([ProductModelID]) REFERENCES [Production].[ProductModel]([ProductModelID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductModelProductDescriptionCulture] ADD CONSTRAINT [FK_ProductModelProductDescriptionCulture_Culture_CultureID] FOREIGN KEY ([CultureID]) REFERENCES [Production].[Culture]([CultureID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductModelProductDescriptionCulture] ADD CONSTRAINT [FK_ProductModelProductDescriptionCulture_ProductDescription_ProductDescriptionID] FOREIGN KEY ([ProductDescriptionID]) REFERENCES [Production].[ProductDescription]([ProductDescriptionID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductModelProductDescriptionCulture] ADD CONSTRAINT [FK_ProductModelProductDescriptionCulture_ProductModel_ProductModelID] FOREIGN KEY ([ProductModelID]) REFERENCES [Production].[ProductModel]([ProductModelID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductProductPhoto] ADD CONSTRAINT [FK_ProductProductPhoto_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductProductPhoto] ADD CONSTRAINT [FK_ProductProductPhoto_ProductPhoto_ProductPhotoID] FOREIGN KEY ([ProductPhotoID]) REFERENCES [Production].[ProductPhoto]([ProductPhotoID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductReview] ADD CONSTRAINT [FK_ProductReview_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[ProductSubcategory] ADD CONSTRAINT [FK_ProductSubcategory_ProductCategory_ProductCategoryID] FOREIGN KEY ([ProductCategoryID]) REFERENCES [Production].[ProductCategory]([ProductCategoryID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[ProductVendor] ADD CONSTRAINT [FK_ProductVendor_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[ProductVendor] ADD CONSTRAINT [FK_ProductVendor_UnitMeasure_UnitMeasureCode] FOREIGN KEY ([UnitMeasureCode]) REFERENCES [Production].[UnitMeasure]([UnitMeasureCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[ProductVendor] ADD CONSTRAINT [FK_ProductVendor_Vendor_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Purchasing].[Vendor]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[PurchaseOrderDetail] ADD CONSTRAINT [FK_PurchaseOrderDetail_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[PurchaseOrderDetail] ADD CONSTRAINT [FK_PurchaseOrderDetail_PurchaseOrderHeader_PurchaseOrderID] FOREIGN KEY ([PurchaseOrderID]) REFERENCES [Purchasing].[PurchaseOrderHeader]([PurchaseOrderID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[PurchaseOrderHeader] ADD CONSTRAINT [FK_PurchaseOrderHeader_Employee_EmployeeID] FOREIGN KEY ([EmployeeID]) REFERENCES [HumanResources].[Employee]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[PurchaseOrderHeader] ADD CONSTRAINT [FK_PurchaseOrderHeader_ShipMethod_ShipMethodID] FOREIGN KEY ([ShipMethodID]) REFERENCES [Purchasing].[ShipMethod]([ShipMethodID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[PurchaseOrderHeader] ADD CONSTRAINT [FK_PurchaseOrderHeader_Vendor_VendorID] FOREIGN KEY ([VendorID]) REFERENCES [Purchasing].[Vendor]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderDetail] ADD CONSTRAINT [FK_SalesOrderDetail_SalesOrderHeader_SalesOrderID] FOREIGN KEY ([SalesOrderID]) REFERENCES [Sales].[SalesOrderHeader]([SalesOrderID]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderDetail] ADD CONSTRAINT [FK_SalesOrderDetail_SpecialOfferProduct_SpecialOfferIDProductID] FOREIGN KEY ([SpecialOfferID], [ProductID]) REFERENCES [Sales].[SpecialOfferProduct]([SpecialOfferID],[ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_Address_BillToAddressID] FOREIGN KEY ([BillToAddressID]) REFERENCES [Person].[Address]([AddressID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_Address_ShipToAddressID] FOREIGN KEY ([ShipToAddressID]) REFERENCES [Person].[Address]([AddressID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_CreditCard_CreditCardID] FOREIGN KEY ([CreditCardID]) REFERENCES [Sales].[CreditCard]([CreditCardID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_CurrencyRate_CurrencyRateID] FOREIGN KEY ([CurrencyRateID]) REFERENCES [Sales].[CurrencyRate]([CurrencyRateID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_Customer_CustomerID] FOREIGN KEY ([CustomerID]) REFERENCES [Sales].[Customer]([CustomerID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_SalesPerson_SalesPersonID] FOREIGN KEY ([SalesPersonID]) REFERENCES [Sales].[SalesPerson]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_SalesTerritory_TerritoryID] FOREIGN KEY ([TerritoryID]) REFERENCES [Sales].[SalesTerritory]([TerritoryID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeader] ADD CONSTRAINT [FK_SalesOrderHeader_ShipMethod_ShipMethodID] FOREIGN KEY ([ShipMethodID]) REFERENCES [Purchasing].[ShipMethod]([ShipMethodID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeaderSalesReason] ADD CONSTRAINT [FK_SalesOrderHeaderSalesReason_SalesOrderHeader_SalesOrderID] FOREIGN KEY ([SalesOrderID]) REFERENCES [Sales].[SalesOrderHeader]([SalesOrderID]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesOrderHeaderSalesReason] ADD CONSTRAINT [FK_SalesOrderHeaderSalesReason_SalesReason_SalesReasonID] FOREIGN KEY ([SalesReasonID]) REFERENCES [Sales].[SalesReason]([SalesReasonID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesPerson] ADD CONSTRAINT [FK_SalesPerson_Employee_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [HumanResources].[Employee]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesPerson] ADD CONSTRAINT [FK_SalesPerson_SalesTerritory_TerritoryID] FOREIGN KEY ([TerritoryID]) REFERENCES [Sales].[SalesTerritory]([TerritoryID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesPersonQuotaHistory] ADD CONSTRAINT [FK_SalesPersonQuotaHistory_SalesPerson_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Sales].[SalesPerson]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesTaxRate] ADD CONSTRAINT [FK_SalesTaxRate_StateProvince_StateProvinceID] FOREIGN KEY ([StateProvinceID]) REFERENCES [Person].[StateProvince]([StateProvinceID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesTerritory] ADD CONSTRAINT [FK_SalesTerritory_CountryRegion_CountryRegionCode] FOREIGN KEY ([CountryRegionCode]) REFERENCES [Person].[CountryRegion]([CountryRegionCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesTerritoryHistory] ADD CONSTRAINT [FK_SalesTerritoryHistory_SalesPerson_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Sales].[SalesPerson]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SalesTerritoryHistory] ADD CONSTRAINT [FK_SalesTerritoryHistory_SalesTerritory_TerritoryID] FOREIGN KEY ([TerritoryID]) REFERENCES [Sales].[SalesTerritory]([TerritoryID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[ShoppingCartItem] ADD CONSTRAINT [FK_ShoppingCartItem_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SpecialOfferProduct] ADD CONSTRAINT [FK_SpecialOfferProduct_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[SpecialOfferProduct] ADD CONSTRAINT [FK_SpecialOfferProduct_SpecialOffer_SpecialOfferID] FOREIGN KEY ([SpecialOfferID]) REFERENCES [Sales].[SpecialOffer]([SpecialOfferID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[StateProvince] ADD CONSTRAINT [FK_StateProvince_CountryRegion_CountryRegionCode] FOREIGN KEY ([CountryRegionCode]) REFERENCES [Person].[CountryRegion]([CountryRegionCode]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Person].[StateProvince] ADD CONSTRAINT [FK_StateProvince_SalesTerritory_TerritoryID] FOREIGN KEY ([TerritoryID]) REFERENCES [Sales].[SalesTerritory]([TerritoryID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[Store] ADD CONSTRAINT [FK_Store_BusinessEntity_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[BusinessEntity]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Sales].[Store] ADD CONSTRAINT [FK_Store_SalesPerson_SalesPersonID] FOREIGN KEY ([SalesPersonID]) REFERENCES [Sales].[SalesPerson]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[TransactionHistory] ADD CONSTRAINT [FK_TransactionHistory_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Purchasing].[Vendor] ADD CONSTRAINT [FK_Vendor_BusinessEntity_BusinessEntityID] FOREIGN KEY ([BusinessEntityID]) REFERENCES [Person].[BusinessEntity]([BusinessEntityID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[WorkOrder] ADD CONSTRAINT [FK_WorkOrder_Product_ProductID] FOREIGN KEY ([ProductID]) REFERENCES [Production].[Product]([ProductID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[WorkOrder] ADD CONSTRAINT [FK_WorkOrder_ScrapReason_ScrapReasonID] FOREIGN KEY ([ScrapReasonID]) REFERENCES [Production].[ScrapReason]([ScrapReasonID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[WorkOrderRouting] ADD CONSTRAINT [FK_WorkOrderRouting_Location_LocationID] FOREIGN KEY ([LocationID]) REFERENCES [Production].[Location]([LocationID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [Production].[WorkOrderRouting] ADD CONSTRAINT [FK_WorkOrderRouting_WorkOrder_WorkOrderID] FOREIGN KEY ([WorkOrderID]) REFERENCES [Production].[WorkOrder]([WorkOrderID]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

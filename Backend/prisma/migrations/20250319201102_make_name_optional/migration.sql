-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL NOT NULL,
    "earned" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdBy" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "suspicious" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Transaction" ("createdAt", "createdBy", "earned", "id", "processed", "processedBy", "remark", "spent", "suspicious", "type", "updatedAt", "utorid") SELECT "createdAt", "createdBy", "earned", "id", "processed", "processedBy", "remark", "spent", "suspicious", "type", "updatedAt", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'pass',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'REGULAR',
    "points" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    "resetToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "birthday" DATETIME,
    "lastLogin" DATETIME,
    "avatarUrl" TEXT
);
INSERT INTO "new_User" ("avatarUrl", "birthday", "createdAt", "email", "expiresAt", "id", "lastLogin", "name", "password", "points", "resetToken", "role", "suspicious", "updatedAt", "utorid", "verified") SELECT "avatarUrl", "birthday", "createdAt", "email", "expiresAt", "id", "lastLogin", "name", "password", "points", "resetToken", "role", "suspicious", "updatedAt", "utorid", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
CREATE INDEX "User_utorid_idx" ON "User"("utorid");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

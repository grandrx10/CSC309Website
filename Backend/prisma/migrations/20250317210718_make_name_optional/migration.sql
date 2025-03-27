-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL NOT NULL,
    "earned" INTEGER NOT NULL,
    "remark" TEXT,
    "createdBy" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "suspicious" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Transaction" ("createdAt", "createdBy", "earned", "id", "processed", "processedBy", "remark", "spent", "type", "updatedAt", "utorid") SELECT "createdAt", "createdBy", "earned", "id", "processed", "processedBy", "remark", "spent", "type", "updatedAt", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

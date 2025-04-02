-- AlterTable
ALTER TABLE "Event" ADD COLUMN "eventId" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL NOT NULL DEFAULT 0,
    "earned" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdBy" TEXT NOT NULL,
    "relatedId" INTEGER,
    "eventId" INTEGER,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "suspicious" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "createdBy", "earned", "id", "processed", "processedBy", "remark", "spent", "suspicious", "type", "updatedAt", "utorid") SELECT "amount", "createdAt", "createdBy", "earned", "id", "processed", "processedBy", "remark", "spent", "suspicious", "type", "updatedAt", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

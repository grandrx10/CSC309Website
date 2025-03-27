/*
  Warnings:

  - Added the required column `endTime` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'automatic',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "isOneTime" BOOLEAN NOT NULL DEFAULT false,
    "minSpending" INTEGER,
    "rate" REAL,
    "points" INTEGER
);
INSERT INTO "new_Promotion" ("id", "isOneTime", "minSpending", "name", "points", "rate") SELECT "id", "isOneTime", "minSpending", "name", "points", "rate" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

/*
  Warnings:

  - You are about to drop the `EventGuest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EventGuest";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "event_guests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "utorid" TEXT NOT NULL,
    CONSTRAINT "event_guests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

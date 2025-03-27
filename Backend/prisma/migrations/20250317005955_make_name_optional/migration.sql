/*
  Warnings:

  - You are about to drop the `EventOrganizer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EventOrganizer";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "event_organizers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventId" INTEGER NOT NULL,
    "utorid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "event_organizers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

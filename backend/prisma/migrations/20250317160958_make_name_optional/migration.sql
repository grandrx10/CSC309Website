/*
  Warnings:

  - A unique constraint covering the columns `[utorid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");

-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('left', 'right');

-- AlterTable
ALTER TABLE "players"
    ADD COLUMN "surname" TEXT NOT NULL DEFAULT ' ',
    ADD COLUMN "nickname" TEXT,
    ADD COLUMN "position" "PlayerPosition";

-- Drop the temporary default used to backfill existing players.
ALTER TABLE "players" ALTER COLUMN "surname" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "players_nickname_key" ON "players"("nickname");

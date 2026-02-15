-- AlterTable
ALTER TABLE `fantasy_players` ADD COLUMN `captainType` ENUM('NONE', 'CAPTAIN', 'TRIPLE_CAPTAIN') NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE `fantasy_teams` ADD COLUMN `tripleCaptainUsed` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `league_members` ADD COLUMN `role` ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER';

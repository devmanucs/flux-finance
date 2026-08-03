/*
  Warnings:

  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Default temporário só pra satisfazer linhas existentes (usuário demo);
-- o seed roda logo em seguida e sobrescreve com o hash real.
ALTER TABLE "users" ADD COLUMN     "password_hash" TEXT NOT NULL DEFAULT 'CHANGE_ME';
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP DEFAULT;

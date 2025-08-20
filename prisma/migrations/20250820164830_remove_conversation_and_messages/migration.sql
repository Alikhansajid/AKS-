/*
  Warnings:

  - You are about to drop the `conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversation_participant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."conversation_participant" DROP CONSTRAINT "conversation_participant_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."conversation_participant" DROP CONSTRAINT "conversation_participant_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."message" DROP CONSTRAINT "message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."message" DROP CONSTRAINT "message_senderId_fkey";

-- DropTable
DROP TABLE "public"."conversation";

-- DropTable
DROP TABLE "public"."conversation_participant";

-- DropTable
DROP TABLE "public"."message";

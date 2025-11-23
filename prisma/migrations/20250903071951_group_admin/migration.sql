/*
  Warnings:

  - You are about to drop the column `type` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the `UserOnConversation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserOnConversation" DROP CONSTRAINT "UserOnConversation_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserOnConversation" DROP CONSTRAINT "UserOnConversation_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Conversation" DROP COLUMN "type",
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."UserOnConversation";

-- DropEnum
DROP TYPE "public"."ConversationType";

-- DropEnum
DROP TYPE "public"."GroupRole";

-- CreateTable
CREATE TABLE "public"."Participant" (
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastRead" TIMESTAMP(3),

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("userId","conversationId")
);

-- CreateIndex
CREATE INDEX "Participant_userId_idx" ON "public"."Participant"("userId");

-- CreateIndex
CREATE INDEX "Participant_conversationId_idx" ON "public"."Participant"("conversationId");

-- CreateIndex
CREATE INDEX "Participant_userId_conversationId_idx" ON "public"."Participant"("userId", "conversationId");

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("public_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

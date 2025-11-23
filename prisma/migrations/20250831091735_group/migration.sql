/*
  Warnings:

  - You are about to drop the `conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_on_conversation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."message" DROP CONSTRAINT "message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_on_conversation" DROP CONSTRAINT "user_on_conversation_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_on_conversation" DROP CONSTRAINT "user_on_conversation_userId_fkey";

-- DropTable
DROP TABLE "public"."conversation";

-- DropTable
DROP TABLE "public"."user_on_conversation";

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "publicId" TEXT,
    "type" "public"."ConversationType" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "profilePic" TEXT,
    "allowAllMessages" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserOnConversation" (
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "public"."GroupRole" DEFAULT 'MEMBER',
    "lastRead" TIMESTAMP(3),

    CONSTRAINT "UserOnConversation_pkey" PRIMARY KEY ("userId","conversationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_publicId_key" ON "public"."Conversation"("publicId");

-- CreateIndex
CREATE INDEX "Conversation_publicId_idx" ON "public"."Conversation"("publicId");

-- CreateIndex
CREATE INDEX "UserOnConversation_userId_idx" ON "public"."UserOnConversation"("userId");

-- CreateIndex
CREATE INDEX "UserOnConversation_conversationId_idx" ON "public"."UserOnConversation"("conversationId");

-- CreateIndex
CREATE INDEX "UserOnConversation_userId_conversationId_idx" ON "public"."UserOnConversation"("userId", "conversationId");

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOnConversation" ADD CONSTRAINT "UserOnConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("public_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOnConversation" ADD CONSTRAINT "UserOnConversation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

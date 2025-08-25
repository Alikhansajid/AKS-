/*
  Warnings:

  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_on_conversations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_on_conversations" DROP CONSTRAINT "user_on_conversations_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_on_conversations" DROP CONSTRAINT "user_on_conversations_userId_fkey";

-- DropTable
DROP TABLE "public"."conversations";

-- DropTable
DROP TABLE "public"."messages";

-- DropTable
DROP TABLE "public"."user_on_conversations";

-- CreateTable
CREATE TABLE "public"."conversation" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_on_conversation" (
    "userId" INTEGER NOT NULL,
    "conversationId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_on_conversation_pkey" PRIMARY KEY ("userId","conversationId")
);

-- CreateTable
CREATE TABLE "public"."message" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_publicId_key" ON "public"."conversation"("publicId");

-- CreateIndex
CREATE INDEX "conversation_publicId_idx" ON "public"."conversation"("publicId");

-- CreateIndex
CREATE INDEX "user_on_conversation_userId_idx" ON "public"."user_on_conversation"("userId");

-- CreateIndex
CREATE INDEX "user_on_conversation_conversationId_idx" ON "public"."user_on_conversation"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "message_publicId_key" ON "public"."message"("publicId");

-- CreateIndex
CREATE INDEX "message_conversationId_idx" ON "public"."message"("conversationId");

-- CreateIndex
CREATE INDEX "message_senderId_idx" ON "public"."message"("senderId");

-- AddForeignKey
ALTER TABLE "public"."user_on_conversation" ADD CONSTRAINT "user_on_conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_on_conversation" ADD CONSTRAINT "user_on_conversation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

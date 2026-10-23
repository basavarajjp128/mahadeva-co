-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('CREATED', 'PENDING', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" UUID NOT NULL,
    "productSlug" VARCHAR(80) NOT NULL,
    "quantityKilograms" DECIMAL(12,3) NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'CREATED',
    "razorpayOrderId" VARCHAR(64),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "razorpayPaymentId" VARCHAR(64) NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "amountRefundedPaise" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" UUID NOT NULL,
    "providerEventId" VARCHAR(128) NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "bodySha256" CHAR(64) NOT NULL,
    "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" UUID NOT NULL,
    "subjectHash" CHAR(64) NOT NULL,
    "windowStart" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_razorpayOrderId_key" ON "PaymentOrder"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_createdAt_idx" ON "PaymentOrder"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_razorpayPaymentId_key" ON "PaymentAttempt"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_status_idx" ON "PaymentAttempt"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_providerEventId_key" ON "WebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "RateLimitBucket_windowStart_idx" ON "RateLimitBucket"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_subjectHash_windowStart_key" ON "RateLimitBucket"("subjectHash", "windowStart");

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

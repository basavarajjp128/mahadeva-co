-- Keep this hand-written migration atomic on PostgreSQL. The migration runner
-- does not provide a documented guarantee that each SQL file is wrapped in a transaction.
BEGIN;

-- Per-schema default-privilege revokes cannot cancel global default grants.
-- Stop rather than silently leave future tables API-accessible if postgres has
-- such a global default ACL; inspect and approve the broader change separately.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'postgres')
      AND d.defaclnamespace = 0
      AND d.defaclobjtype = 'r'
      AND COALESCE(grantee.rolname, 'PUBLIC') IN ('PUBLIC', 'anon', 'authenticated', 'service_role')
  ) THEN
    RAISE EXCEPTION 'Global default table grants for postgres require separate review before payment migration';
  END IF;
END $$;

-- Prevent newly created public tables owned by postgres from inheriting
-- Supabase API-role access. This affects future objects created by postgres
-- in public, not grants on existing tables. Future public tables need explicit ACLs.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;

-- CreateEnum
CREATE TYPE public."PaymentOrderStatus" AS ENUM ('CREATED', 'PENDING', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE public."PaymentAttemptStatus" AS ENUM ('AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable
CREATE TABLE public."PaymentOrder" (
    "id" UUID NOT NULL,
    "productSlug" VARCHAR(80) NOT NULL,
    "quantityKilograms" DECIMAL(12,3) NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" public."PaymentOrderStatus" NOT NULL DEFAULT 'CREATED',
    "razorpayOrderId" VARCHAR(64),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE public."PaymentAttempt" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "razorpayPaymentId" VARCHAR(64) NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "amountRefundedPaise" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL,
    "status" public."PaymentAttemptStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE public."WebhookEvent" (
    "id" UUID NOT NULL,
    "providerEventId" VARCHAR(128) NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "bodySha256" CHAR(64) NOT NULL,
    "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE public."RateLimitBucket" (
    "id" UUID NOT NULL,
    "subjectHash" CHAR(64) NOT NULL,
    "windowStart" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_razorpayOrderId_key" ON public."PaymentOrder"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_createdAt_idx" ON public."PaymentOrder"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_razorpayPaymentId_key" ON public."PaymentAttempt"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_status_idx" ON public."PaymentAttempt"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_providerEventId_key" ON public."WebhookEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "RateLimitBucket_windowStart_idx" ON public."RateLimitBucket"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_subjectHash_windowStart_key" ON public."RateLimitBucket"("subjectHash", "windowStart");

-- AddForeignKey
ALTER TABLE public."PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."PaymentOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- These records are server-only. API roles receive no table privileges and
-- RLS is enabled as defense in depth. There are intentionally no client policies.
-- Prisma creates its migration ledger before applying this SQL file, so it
-- needs the same explicit protection despite being created before the new defaults.
REVOKE ALL PRIVILEGES ON TABLE
  public."_prisma_migrations",
  public."PaymentOrder",
  public."PaymentAttempt",
  public."WebhookEvent",
  public."RateLimitBucket"
FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PaymentOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PaymentAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RateLimitBucket" ENABLE ROW LEVEL SECURITY;

-- Prisma's dedicated application role owns only these payment/rate-limit
-- objects. Object owners can operate under RLS without an API-facing policy.
REVOKE ALL PRIVILEGES ON TYPE
  public."PaymentOrderStatus",
  public."PaymentAttemptStatus"
FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public."PaymentOrder" OWNER TO smc_payment_runtime;
ALTER TABLE public."PaymentAttempt" OWNER TO smc_payment_runtime;
ALTER TABLE public."WebhookEvent" OWNER TO smc_payment_runtime;
ALTER TABLE public."RateLimitBucket" OWNER TO smc_payment_runtime;
ALTER TYPE public."PaymentOrderStatus" OWNER TO smc_payment_runtime;
ALTER TYPE public."PaymentAttemptStatus" OWNER TO smc_payment_runtime;

GRANT USAGE ON SCHEMA public TO smc_payment_runtime;
REVOKE CREATE ON SCHEMA public FROM smc_payment_runtime;

COMMIT;

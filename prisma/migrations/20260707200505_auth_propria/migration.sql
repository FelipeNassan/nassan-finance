-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "app_user_activated_at" TIMESTAMP(3),
ADD COLUMN     "app_user_birth_date" DATE,
ADD COLUMN     "app_user_email" VARCHAR(255),
ADD COLUMN     "app_user_email_verified_at" TIMESTAMP(3),
ADD COLUMN     "app_user_first_name" VARCHAR(60),
ADD COLUMN     "app_user_last_name" VARCHAR(60),
ADD COLUMN     "app_user_password_hash" VARCHAR(255),
ADD COLUMN     "app_user_phone" VARCHAR(20),
ADD COLUMN     "app_user_phone_verified_at" TIMESTAMP(3),
ADD COLUMN     "app_user_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "phone_verification_code" (
    "phone_verification_code_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "phone_verification_code_phone" VARCHAR(20) NOT NULL,
    "phone_verification_code_code" VARCHAR(6) NOT NULL,
    "phone_verification_code_attempts" INTEGER NOT NULL DEFAULT 0,
    "phone_verification_code_expires_at" TIMESTAMP(3) NOT NULL,
    "phone_verification_code_used_at" TIMESTAMP(3),
    "phone_verification_code_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verification_code_pkey" PRIMARY KEY ("phone_verification_code_id")
);

-- CreateTable
CREATE TABLE "email_verification_token" (
    "email_verification_token_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "email_verification_token_token" VARCHAR(128) NOT NULL,
    "email_verification_token_expires_at" TIMESTAMP(3) NOT NULL,
    "email_verification_token_used_at" TIMESTAMP(3),
    "email_verification_token_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_token_pkey" PRIMARY KEY ("email_verification_token_id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "password_reset_token_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "password_reset_token_token" VARCHAR(128) NOT NULL,
    "password_reset_token_expires_at" TIMESTAMP(3) NOT NULL,
    "password_reset_token_used_at" TIMESTAMP(3),
    "password_reset_token_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("password_reset_token_id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "refresh_token_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "refresh_token_hash" VARCHAR(128) NOT NULL,
    "refresh_token_expires_at" TIMESTAMP(3) NOT NULL,
    "refresh_token_revoked_at" TIMESTAMP(3),
    "refresh_token_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("refresh_token_id")
);

-- CreateTable
CREATE TABLE "auth_log" (
    "auth_log_id" SERIAL NOT NULL,
    "app_user_id" TEXT,
    "auth_log_email" VARCHAR(255),
    "auth_log_event" VARCHAR(40) NOT NULL,
    "auth_log_ip" VARCHAR(45),
    "auth_log_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_log_pkey" PRIMARY KEY ("auth_log_id")
);

-- CreateIndex
CREATE INDEX "idx_phone_verification_code_user" ON "phone_verification_code"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_token_email_verification_token_token_key" ON "email_verification_token"("email_verification_token_token");

-- CreateIndex
CREATE INDEX "idx_email_verification_token_user" ON "email_verification_token"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_password_reset_token_token_key" ON "password_reset_token"("password_reset_token_token");

-- CreateIndex
CREATE INDEX "idx_password_reset_token_user" ON "password_reset_token"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_refresh_token_hash_key" ON "refresh_token"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_token_user" ON "refresh_token"("app_user_id");

-- CreateIndex
CREATE INDEX "idx_auth_log_email_event" ON "auth_log"("auth_log_email", "auth_log_event", "auth_log_created_at");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_app_user_email_key" ON "app_user"("app_user_email");

-- AddForeignKey
ALTER TABLE "phone_verification_code" ADD CONSTRAINT "phone_verification_code_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_token" ADD CONSTRAINT "email_verification_token_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_log" ADD CONSTRAINT "auth_log_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE SET NULL ON UPDATE CASCADE;


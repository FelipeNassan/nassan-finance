-- CreateTable
CREATE TABLE "app_user" (
    "app_user_id" TEXT NOT NULL,
    "app_user_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("app_user_id")
);

-- CreateTable
CREATE TABLE "expense_category" (
    "expense_category_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "expense_category_name" VARCHAR(60) NOT NULL,
    "expense_category_is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "expense_category_pkey" PRIMARY KEY ("expense_category_id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "payment_method_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "payment_method_name" VARCHAR(40) NOT NULL,
    "payment_method_is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("payment_method_id")
);

-- CreateTable
CREATE TABLE "bank" (
    "bank_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "bank_name" VARCHAR(60) NOT NULL,
    "bank_is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bank_pkey" PRIMARY KEY ("bank_id")
);

-- CreateTable
CREATE TABLE "card" (
    "card_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "card_nickname" VARCHAR(60) NOT NULL,
    "card_closing_day" SMALLINT NOT NULL,
    "card_due_day" SMALLINT NOT NULL,
    "card_is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "card_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "invoice_id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "invoice_start_date" DATE NOT NULL,
    "invoice_end_date" DATE NOT NULL,
    "invoice_due_date" DATE NOT NULL,
    "invoice_is_paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "holiday" (
    "holiday_id" SERIAL NOT NULL,
    "holiday_name" VARCHAR(80) NOT NULL,
    "holiday_scope" VARCHAR(20),

    CONSTRAINT "holiday_pkey" PRIMARY KEY ("holiday_id")
);

-- CreateTable
CREATE TABLE "calendar_day" (
    "calendar_day_date" DATE NOT NULL,
    "calendar_day_weekday_name" VARCHAR(15) NOT NULL,
    "calendar_day_day_of_month" SMALLINT NOT NULL,
    "calendar_day_is_business_day" BOOLEAN NOT NULL,
    "calendar_day_business_day_number" SMALLINT,
    "holiday_id" INTEGER,

    CONSTRAINT "calendar_day_pkey" PRIMARY KEY ("calendar_day_date")
);

-- CreateTable
CREATE TABLE "expense" (
    "expense_id" SERIAL NOT NULL,
    "app_user_id" TEXT NOT NULL,
    "expense_date" DATE NOT NULL,
    "expense_amount" DECIMAL(12,2) NOT NULL,
    "expense_description" VARCHAR(255),
    "expense_reason" VARCHAR(255),
    "expense_trigger" VARCHAR(120),
    "expense_category_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "bank_id" INTEGER,
    "card_id" INTEGER,
    "invoice_id" INTEGER,
    "expense_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "expense_bank" (
    "expense_id" INTEGER NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "expense_bank_amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "expense_bank_pkey" PRIMARY KEY ("expense_id","bank_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_category_app_user_id_expense_category_name_key" ON "expense_category"("app_user_id", "expense_category_name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_app_user_id_payment_method_name_key" ON "payment_method"("app_user_id", "payment_method_name");

-- CreateIndex
CREATE UNIQUE INDEX "bank_app_user_id_bank_name_key" ON "bank"("app_user_id", "bank_name");

-- CreateIndex
CREATE INDEX "idx_invoice_card" ON "invoice"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_card_id_invoice_start_date_key" ON "invoice"("card_id", "invoice_start_date");

-- CreateIndex
CREATE INDEX "idx_expense_user_date" ON "expense"("app_user_id", "expense_date");

-- CreateIndex
CREATE INDEX "idx_expense_category" ON "expense"("expense_category_id");

-- CreateIndex
CREATE INDEX "idx_expense_invoice" ON "expense"("invoice_id");

-- AddForeignKey
ALTER TABLE "expense_category" ADD CONSTRAINT "expense_category_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank" ADD CONSTRAINT "bank_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card" ADD CONSTRAINT "card_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card" ADD CONSTRAINT "card_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "bank"("bank_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "card"("card_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_day" ADD CONSTRAINT "calendar_day_holiday_id_fkey" FOREIGN KEY ("holiday_id") REFERENCES "holiday"("holiday_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_user"("app_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_expense_date_fkey" FOREIGN KEY ("expense_date") REFERENCES "calendar_day"("calendar_day_date") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_category"("expense_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("payment_method_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "bank"("bank_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "card"("card_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_bank" ADD CONSTRAINT "expense_bank_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expense"("expense_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_bank" ADD CONSTRAINT "expense_bank_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "bank"("bank_id") ON DELETE RESTRICT ON UPDATE CASCADE;

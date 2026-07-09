-- AlterTable
ALTER TABLE "expense" ADD COLUMN     "expense_deleted_at" TIMESTAMP(3),
ADD COLUMN     "expense_deleted_description" VARCHAR(255),
ADD COLUMN     "expense_is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_expense_user_deleted" ON "expense"("app_user_id", "expense_is_deleted");

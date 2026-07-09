-- AlterTable
ALTER TABLE "expense_category" ADD COLUMN     "expense_category_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expense_category_deleted_at" TIMESTAMP(3),
ADD COLUMN     "expense_category_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payment_method" ADD COLUMN     "payment_method_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payment_method_deleted_at" TIMESTAMP(3),
ADD COLUMN     "payment_method_order" INTEGER NOT NULL DEFAULT 0;

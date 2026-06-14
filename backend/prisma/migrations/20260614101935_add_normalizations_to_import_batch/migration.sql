-- AlterTable
ALTER TABLE "import_batches" ADD COLUMN     "normalizations" TEXT[] DEFAULT ARRAY[]::TEXT[];

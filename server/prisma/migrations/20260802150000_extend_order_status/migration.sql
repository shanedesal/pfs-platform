-- AlterEnum
-- Insert the new fulfillment stages between CONFIRMED and CANCELLED so the
-- enum's natural order matches the admin order workflow (Pending, Confirmed,
-- Preparing, Shipped, Completed, Cancelled).
ALTER TYPE "OrderStatus" ADD VALUE 'PREPARING' BEFORE 'CANCELLED';
ALTER TYPE "OrderStatus" ADD VALUE 'SHIPPED' AFTER 'PREPARING';
ALTER TYPE "OrderStatus" ADD VALUE 'COMPLETED' AFTER 'SHIPPED';

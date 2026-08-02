import { orderStatusLabel, type OrderStatus } from "@/lib/orders";

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber/10 text-amber",
  CONFIRMED: "bg-brand/10 text-brand",
  PREPARING: "bg-ink/10 text-ink dark:bg-paper/10 dark:text-paper",
  SHIPPED: "bg-brand-dark/10 text-brand-dark",
  COMPLETED: "bg-success/10 text-success",
  CANCELLED: "bg-red-500/10 text-red-500",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}>
      {orderStatusLabel(status)}
    </span>
  );
}

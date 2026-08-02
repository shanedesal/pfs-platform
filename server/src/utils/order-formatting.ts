import { Prisma } from "@prisma/client";

/** Shared `Order` include/shape used by both the customer and admin order endpoints. */
export const orderInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: { id: true, imageUrl: true },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/** Renders an `Order` (with its items) into the API response shape used everywhere. */
export function formatOrder(order: OrderWithItems) {
  const items = order.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    unitPrice: Number(item.unitPrice),
    quantity: item.quantity,
    lineTotal: Number(item.lineTotal),
    imageUrl: item.product.imageUrl,
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    contactNumber: order.contactNumber,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod,
    orderNotes: order.orderNotes,
    status: order.status,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt.toISOString(),
  };
}

/** Express 5 route params can be `string | string[] | undefined`; narrow to a single order number. */
export function paramOrderNumber(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim();
  return "";
}

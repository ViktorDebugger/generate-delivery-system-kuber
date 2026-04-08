export const OrderDeliveryStatus = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderDeliveryStatusValue =
  (typeof OrderDeliveryStatus)[keyof typeof OrderDeliveryStatus];

export const ORDER_DELIVERY_STATUS_VALUES: OrderDeliveryStatusValue[] = [
  OrderDeliveryStatus.CREATED,
  OrderDeliveryStatus.ASSIGNED,
  OrderDeliveryStatus.IN_TRANSIT,
  OrderDeliveryStatus.DELIVERED,
  OrderDeliveryStatus.CANCELLED,
];

const LEGACY_STATUS_MAP: Record<string, OrderDeliveryStatusValue> = {
  SHIPPED: OrderDeliveryStatus.IN_TRANSIT,
};

const TRANSITIONS: Record<
  OrderDeliveryStatusValue,
  readonly OrderDeliveryStatusValue[]
> = {
  [OrderDeliveryStatus.CREATED]: [
    OrderDeliveryStatus.ASSIGNED,
    OrderDeliveryStatus.CANCELLED,
  ],
  [OrderDeliveryStatus.ASSIGNED]: [
    OrderDeliveryStatus.IN_TRANSIT,
    OrderDeliveryStatus.CANCELLED,
  ],
  [OrderDeliveryStatus.IN_TRANSIT]: [
    OrderDeliveryStatus.DELIVERED,
    OrderDeliveryStatus.CANCELLED,
  ],
  [OrderDeliveryStatus.DELIVERED]: [],
  [OrderDeliveryStatus.CANCELLED]: [],
};

export function normalizeOrderStatus(raw: string): OrderDeliveryStatusValue {
  const u = raw.trim().toUpperCase();
  const mapped = LEGACY_STATUS_MAP[u] ?? u;
  if (ORDER_DELIVERY_STATUS_VALUES.includes(mapped)) {
    return mapped;
  }
  throw new Error(`Invalid order status: ${raw}`);
}

export function canTransitionOrderStatus(
  fromRaw: string,
  toRaw: string,
): boolean {
  const from = normalizeOrderStatus(fromRaw);
  const to = normalizeOrderStatus(toRaw);
  if (from === to) {
    return true;
  }
  return TRANSITIONS[from].includes(to);
}

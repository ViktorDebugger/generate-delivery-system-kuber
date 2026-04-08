export type DeliveryReportFilter = {
  dateFrom: Date;
  dateTo: Date;
  courierId?: string;
  status?: string;
};

export type DeliveriesReportResponse = {
  totalOrders: number;
  byStatus: Record<string, number>;
  byCourier: Array<{
    courierId: string | null;
    name: string | null;
    orderCount: number;
  }>;
  weight: {
    sum: number;
    average: number;
  };
};

export interface ClientEntity {
  id: string;
  fullName: string;
  email: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderEntity {
  id: string;
  orderNumber: string;
  weight: number;
  status: string;
  senderId: string;
  receiverId: string;
  courierId?: string;
  estimatedArrivalTime?: string;
  productIds: string[];
}

export interface OrderProductRef {
  id: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  weight: number;
  status: string;
  senderId: string;
  receiverId: string;
  courierId?: string;
  estimatedArrivalTime?: string;
  products: OrderProductRef[];
}

export type OrderWithSenderResponse = OrderResponse & {
  sender: ClientEntity;
};

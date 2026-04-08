export interface TransportEntity {
  id: string;
  name: string;
  description?: string;
}

export interface CourierEntity {
  id: string;
  name: string;
  transportId?: string;
  isAvailable: boolean;
}

export interface CourierLocationEntity {
  id: string;
  courierId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export type CourierLocationResponse = CourierLocationEntity;

export type CourierResponse = CourierEntity & {
  transport?: TransportEntity;
};

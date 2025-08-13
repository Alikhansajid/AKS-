export enum OrderStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export type OrderItem = {
  id: number;
  product: { name: string };
  quantity: number;
  price: number;
};

export type Order = {
  id: number;
  publicId: string;
  user: { name: string };
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
};
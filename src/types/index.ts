// types/index.ts

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface Order {
  id: number;
  status: string;
  items: OrderItem[];
}

// ✅ Add this:
export interface SessionData {
  user?: {
    publicId: string;
    email: string;
    name: string;
    phone?: string;
    profilePic?: string;
  };
}


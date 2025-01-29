export type Category = {
  id: string;
  name: string;
}

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

export type Inventory = {
  id: string;
  product_id: string;
  quantity: number;
  last_updated: Date;
}

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  order_date: Date;
  total_amount: number;
  status: string;
}

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
}

export type Payment = {
  id: string;
  order_id: string;
  transaction_id: string;
  amount: number;
  payment_date: Date;
  status: PaymentStatus;
  payment_method: string;
  currency: string;
}

export type Refund = {
  id: string;
  order_id: string;
  amount: number;
  refund_date: Date;
  reason: string;
}

export type ShippingInformation = {
  id: string;
  user_id: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  phone_number: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
} 
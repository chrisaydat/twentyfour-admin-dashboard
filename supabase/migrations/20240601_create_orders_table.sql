-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (will be ignored if rows already exist)
INSERT INTO orders (id, customer_name, customer_email, status, total_amount)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', 'Pending', 99.99),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane@example.com', 'Active', 149.99),
  ('00000000-0000-0000-0000-000000000003', 'Bob Johnson', 'bob@example.com', 'Completed', 79.99),
  ('00000000-0000-0000-0000-000000000004', 'Alice Brown', 'alice@example.com', 'Cancelled', 199.99),
  ('00000000-0000-0000-0000-000000000005', 'Charlie Wilson', 'charlie@example.com', 'Pending', 59.99)
ON CONFLICT (id) DO NOTHING; 
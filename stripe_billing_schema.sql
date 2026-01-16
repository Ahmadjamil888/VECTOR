-- Stripe Billing Integration SQL Schema

-- Create customers table to store Stripe customer IDs
CREATE TABLE IF NOT EXISTS stripe_customers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table to store Stripe product information
CREATE TABLE IF NOT EXISTS stripe_products (
  id SERIAL PRIMARY KEY,
  stripe_product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prices table to store Stripe pricing information
CREATE TABLE IF NOT EXISTS stripe_prices (
  id SERIAL PRIMARY KEY,
  stripe_price_id TEXT UNIQUE NOT NULL,
  stripe_product_id TEXT NOT NULL,
  nickname TEXT,
  currency TEXT NOT NULL,
  type TEXT NOT NULL, -- 'one_time' or 'recurring'
  unit_amount BIGINT, -- Amount in cents
  recurring_interval TEXT, -- 'day', 'week', 'month', 'year'
  recurring_interval_count INTEGER,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (stripe_product_id) REFERENCES stripe_products(stripe_product_id)
);

-- Create subscriptions table to store active Stripe subscriptions
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create invoices table to store Stripe invoice information
CREATE TABLE IF NOT EXISTS stripe_invoices (
  id SERIAL PRIMARY KEY,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  amount_due BIGINT, -- Amount in cents
  amount_paid BIGINT, -- Amount in cents
  currency TEXT,
  status TEXT, -- 'draft', 'open', 'paid', 'uncollectible', 'void'
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook events table to store Stripe webhook payloads
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id SERIAL PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- Event type (e.g., customer.subscription.created, invoice.payment_succeeded)
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Update the profiles table to include Stripe-related fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'; -- 'inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free'; -- 'free', 'pro', 'enterprise'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- RLS policies for stripe_customers table
CREATE POLICY "Users can view own stripe customer" ON stripe_customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stripe customer" ON stripe_customers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for stripe_subscriptions table
CREATE POLICY "Users can view own stripe subscriptions" ON stripe_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stripe subscriptions" ON stripe_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for stripe_invoices table
CREATE POLICY "Users can view own stripe invoices" ON stripe_invoices FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_id ON stripe_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_stripe_id ON stripe_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update the updated_at timestamp
CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_products_updated_at BEFORE UPDATE ON stripe_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_prices_updated_at BEFORE UPDATE ON stripe_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_subscriptions_updated_at BEFORE UPDATE ON stripe_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stripe_invoices_updated_at BEFORE UPDATE ON stripe_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample product and price data (these would be created in Stripe dashboard)
-- Free Plan
INSERT INTO stripe_products (stripe_product_id, name, description, active) VALUES
  ('prod_free_default', 'Free Plan', 'Basic features for getting started', true)
ON CONFLICT (stripe_product_id) DO NOTHING;

INSERT INTO stripe_prices (stripe_price_id, stripe_product_id, nickname, currency, type, unit_amount, active) VALUES
  ('price_free_default', 'prod_free_default', 'Free Plan', 'usd', 'recurring', 0, true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Pro Plan
INSERT INTO stripe_products (stripe_product_id, name, description, active) VALUES
  ('prod_pro_monthly', 'Pro Monthly', 'Professional features for power users', true),
  ('prod_pro_yearly', 'Pro Yearly', 'Professional features for power users (annual)', true)
ON CONFLICT (stripe_product_id) DO NOTHING;

INSERT INTO stripe_prices (stripe_price_id, stripe_product_id, nickname, currency, type, unit_amount, recurring_interval, recurring_interval_count, active) VALUES
  ('price_pro_monthly', 'prod_pro_monthly', 'Pro Monthly', 'usd', 'recurring', 2900, 'month', 1, true),
  ('price_pro_yearly', 'prod_pro_yearly', 'Pro Yearly', 'usd', 'recurring', 29000, 'year', 1, true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- Enterprise Plan
INSERT INTO stripe_products (stripe_product_id, name, description, active) VALUES
  ('prod_enterprise_monthly', 'Enterprise Monthly', 'Advanced features for enterprises', true),
  ('prod_enterprise_yearly', 'Enterprise Yearly', 'Advanced features for enterprises (annual)', true)
ON CONFLICT (stripe_product_id) DO NOTHING;

INSERT INTO stripe_prices (stripe_price_id, stripe_product_id, nickname, currency, type, unit_amount, recurring_interval, recurring_interval_count, active) VALUES
  ('price_enterprise_monthly', 'prod_enterprise_monthly', 'Enterprise Monthly', 'usd', 'recurring', 9900, 'month', 1, true),
  ('price_enterprise_yearly', 'prod_enterprise_yearly', 'Enterprise Yearly', 'usd', 'recurring', 99000, 'year', 1, true)
ON CONFLICT (stripe_price_id) DO NOTHING;
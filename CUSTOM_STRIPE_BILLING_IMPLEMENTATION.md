# Custom Stripe Billing Implementation

## Overview
This implementation replaces Clerk's billing system with a custom Stripe billing solution integrated with Supabase. The system maintains Clerk for authentication while using Stripe for payment processing and Supabase for storing billing-related data.

## Key Changes Made

### 1. Database Schema (`stripe_billing_schema.sql`)
- Created tables for Stripe customers, products, prices, subscriptions, invoices, and webhook events
- Added billing-related fields to the existing `profiles` table
- Implemented RLS policies for secure access to billing data
- Added indexes for performance optimization
- Created triggers to maintain updated timestamps

### 2. Stripe Checkout API (`app/api/stripe/checkout/route.ts`)
- Handles creation of Stripe checkout sessions
- Validates user and price IDs
- Integrates with Supabase for user data retrieval
- Returns checkout URLs for subscription processing

### 3. Stripe Webhook Handler (`app/api/stripe/webhook/route.ts`)
- Processes Stripe webhook events (subscriptions, payments, cancellations)
- Updates user profiles based on subscription status
- Stores invoice data and webhook events for audit trails
- Handles payment successes and failures

### 4. User Profile API (`app/api/user/profile/route.ts`)
- Retrieves user profile data from Supabase
- Provides profile information to the frontend for plan-based UI adjustments

### 5. Pricing Page (`app/pricing/page.tsx`)
- Displays subscription plans with feature lists
- Handles subscription selection and checkout initiation
- Shows plan-specific features and pricing

### 6. Plan Limit Service (`lib/plan-limit-service.ts`)
- Defines plan limits based on subscription tier (free, pro, enterprise)
- Checks user permissions for various features
- Validates dataset upload permissions based on plan limits
- Provides feature access checks for advanced functionality

## Plan Features

### Free Plan
- 3 Datasets
- Basic Cleaning Agents
- 100MB Storage
- Community Support

### Pro Plan
- Unlimited Datasets
- Advanced AI Agents (Groq Llama 3)
- 10GB Storage
- Priority Support
- API Access

### Enterprise Plan
- Everything in Pro
- Custom AI Models
- 1TB Storage
- 24/7 Dedicated Support
- SSO & Audit Logs

## Integration Points

### Authentication
- Clerk handles user authentication
- Clerk session tokens are used with Supabase RLS policies
- User IDs from Clerk are stored in Supabase for linking data

### Billing
- Stripe handles payment processing
- Supabase stores billing metadata
- Webhooks synchronize subscription status between Stripe and Supabase

### Feature Access Control
- PlanLimitService checks user permissions
- Different features are available based on subscription tier
- Dataset upload limits are enforced by plan

## Environment Variables Required

```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
```

## Setup Instructions

1. Run the `stripe_billing_schema.sql` script in your Supabase dashboard to set up the database
2. Configure your Stripe account and add products/prices matching the IDs in the schema
3. Set up Stripe webhook endpoints pointing to your `/api/stripe/webhook` route
4. Add the required environment variables to your deployment
5. Update the pricing page to match your actual Stripe product/price IDs

## Migration Benefits

- Full control over billing logic and user experience
- Direct integration with your data in Supabase
- Ability to customize plans and features without relying on Clerk's billing UI
- Maintains Clerk for authentication while separating billing concerns
- Better alignment with your data science platform requirements
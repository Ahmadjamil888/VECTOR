import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Webhook endpoint to handle Stripe events
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature');
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // In a real implementation, verify the webhook signature
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);

    // For now, we'll parse the payload directly as JSON
    // Note: In a real implementation, you'd want to verify the signature
    const event = JSON.parse(payload);

    // Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key for admin operations
    );

    // Handle different Stripe events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Update user's subscription in Supabase
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          // Determine plan based on price ID
          let plan = 'free';
          if (subscription.items.data[0].price.id.includes('pro')) {
            plan = 'pro';
          } else if (subscription.items.data[0].price.id.includes('enterprise')) {
            plan = 'enterprise';
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              subscription_tier: plan,
              subscription_status: subscription.status,
              subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              subscription_cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating user subscription:', updateError);
            return new Response('Error updating user subscription', { status: 500 });
          }

          // Also update/create in stripe_subscriptions table
          const { error: subError } = await supabase
            .from('stripe_subscriptions')
            .upsert([{
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              stripe_price_id: subscription.items.data[0].price.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              created_at: new Date(subscription.created * 1000).toISOString(),
              updated_at: new Date().toISOString()
            }], { onConflict: 'stripe_subscription_id' });

          if (subError) {
            console.error('Error updating stripe_subscriptions:', subError);
            return new Response('Error updating stripe subscriptions', { status: 500 });
          }

          console.log(`Subscription updated for user ${userId} to plan ${plan}`);
        }
        break;

      case 'customer.subscription.deleted':
      case 'customer.subscription.canceled':
        // Downgrade user to free tier
        const deletedSubscription = event.data.object;
        const deletedUserId = deletedSubscription.metadata?.user_id;

        if (deletedUserId) {
          const { error: downgradeError } = await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              subscription_period_end: new Date(deletedSubscription.ended_at * 1000).toISOString(),
              subscription_cancel_at_period_end: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', deletedUserId);

          if (downgradeError) {
            console.error('Error downgrading user subscription:', downgradeError);
            return new Response('Error downgrading user subscription', { status: 500 });
          }

          // Update subscription status in stripe_subscriptions table
          const { error: subDowngradeError } = await supabase
            .from('stripe_subscriptions')
            .update({
              status: 'canceled',
              ended_at: new Date(deletedSubscription.ended_at * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', deletedSubscription.id);

          if (subDowngradeError) {
            console.error('Error updating canceled subscription:', subDowngradeError);
            return new Response('Error updating canceled subscription', { status: 500 });
          }

          console.log(`Subscription canceled for user ${deletedUserId}, downgraded to free tier`);
        }
        break;

      case 'invoice.payment_succeeded':
        // Payment succeeded, update user's credit balance based on plan
        const invoice = event.data.object;
        const invoiceUserId = invoice.metadata?.user_id;

        if (invoiceUserId) {
          // Update credits based on the plan
          let creditsToAdd = 0;
          if (invoice.lines.data[0].price.id.includes('pro')) {
            creditsToAdd = 1000; // Pro plan gets 1000 credits
          } else if (invoice.lines.data[0].price.id.includes('enterprise')) {
            creditsToAdd = 10000; // Enterprise plan gets 10000 credits
          }

          if (creditsToAdd > 0) {
            const { error: creditsError } = await supabase
              .from('profiles')
              .update({
                credits_remaining: creditsToAdd,
                updated_at: new Date().toISOString()
              })
              .eq('id', invoiceUserId);

            if (creditsError) {
              console.error('Error updating credits:', creditsError);
              return new Response('Error updating credits', { status: 500 });
            }
          }

          // Store invoice in our database
          const { error: invoiceError } = await supabase
            .from('stripe_invoices')
            .insert([{
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: invoice.subscription,
              user_id: invoiceUserId,
              amount_due: invoice.amount_due,
              amount_paid: invoice.amount_paid,
              currency: invoice.currency,
              status: invoice.status,
              invoice_pdf: invoice.invoice_pdf,
              hosted_invoice_url: invoice.hosted_invoice_url,
              created_at: new Date(invoice.created * 1000).toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (invoiceError) {
            console.error('Error storing invoice:', invoiceError);
            return new Response('Error storing invoice', { status: 500 });
          }

          console.log(`Payment succeeded for user ${invoiceUserId}, added ${creditsToAdd} credits`);
        }
        break;

      case 'invoice.payment_failed':
        // Payment failed, potentially downgrade user
        const failedInvoice = event.data.object;
        const failedUserId = failedInvoice.metadata?.user_id;

        if (failedUserId) {
          console.log(`Payment failed for user ${failedUserId}, subscription may be suspended`);
          // In a real implementation, you might want to update the subscription status
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Store webhook event in our database for audit trail
    const { error: webhookError } = await supabase
      .from('stripe_webhook_events')
      .insert([{
        stripe_event_id: event.id,
        type: event.type,
        payload: event,
        processed: true,
        created_at: new Date().toISOString()
      }]);

    if (webhookError) {
      console.error('Error storing webhook event:', webhookError);
    }

    // Return success response
    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}
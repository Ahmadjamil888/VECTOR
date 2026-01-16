import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { WebhookEvent } from '@clerk/nextjs/server'; // Commented out due to module issues
// Define the interface locally for now
interface WebhookEvent {
  type: string;
  data: any;
}

// Webhook endpoint to handle Clerk Billing events
// This would receive notifications from Clerk about subscription changes
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const sig = request.headers.get('svix-signature');
    const secret = process.env.CLERK_WEBHOOK_SECRET; // Clerk webhook signing secret

    // In a real implementation, verify the webhook signature
    // const verifiedPayload = await verifySignature(payload, sig, secret);

    // Parse the webhook event
    const event: WebhookEvent = JSON.parse(payload);

    // Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key for admin operations
    );

    // Handle different billing events
    switch (event.type) {
      case 'user.subscription.created':
      case 'user.subscription.updated':
        // Update user's subscription in Supabase
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: event.data.subscription.plan_id,
            credits_remaining: getInitialCredits(event.data.subscription.plan_id), // Set credits based on plan
            updated_at: new Date().toISOString()
          })
          .eq('id', event.data.user.id)
          .select()
          .single();

        if (userError) {
          console.error('Error updating user subscription:', userError);
          return new Response('Error updating user subscription', { status: 500 });
        }

        console.log(`Subscription updated for user ${event.data.user.id} to plan ${event.data.subscription.plan_id}`);
        break;

      case 'user.subscription.deleted':
        // Downgrade user to free tier
        const { error: downgradeError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            credits_remaining: 10, // Reset to free tier credits
            updated_at: new Date().toISOString()
          })
          .eq('id', event.data.user.id);

        if (downgradeError) {
          console.error('Error downgrading user subscription:', downgradeError);
          return new Response('Error downgrading user subscription', { status: 500 });
        }

        console.log(`Subscription cancelled for user ${event.data.user.id}, downgraded to free tier`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing billing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}

// Helper function to determine initial credits based on plan
function getInitialCredits(planId: string): number {
  switch (planId) {
    case 'pro':
      return 1000; // Pro plan gets 1000 credits
    case 'premium':
      return 10000; // Premium plan gets 10000 credits
    case 'free':
    default:
      return 10; // Free plan gets 10 credits
  }
}
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API route for creating a Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    // In a real implementation, we would get the user from Clerk
    // For now, we'll simulate the user
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const priceId = searchParams.get('price_id');
    const returnUrl = searchParams.get('return_url') || '/dashboard/subscription';

    if (!userId || !priceId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate price ID
    const validPriceIds = ['price_free_default', 'price_pro_monthly', 'price_pro_yearly', 'price_enterprise_monthly', 'price_enterprise_yearly'];
    if (!validPriceIds.includes(priceId)) {
      return new Response(JSON.stringify({ error: 'Invalid price ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key for admin operations
    );

    // Get user profile to get email for Stripe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // In a real implementation, we would create a Stripe checkout session
    // For demo purposes, we'll return a mock checkout URL
    const checkoutUrl = `/api/stripe/checkout?session_id=mock_session_${Date.now()}&user_id=${userId}&price_id=${priceId}`;

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      checkoutUrl,
      userId,
      priceId,
      returnUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in Stripe checkout API route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
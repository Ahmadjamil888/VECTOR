"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckIcon, SparklesIcon } from 'lucide-react';

export default function PricingPage() {
  // In a real app, this would come from your authentication context
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real implementation, you would get the current user from your auth system
    // and fetch their profile from your database
    const fetchUserData = async () => {
      try {
        // Mock user data - in reality, you'd get this from your auth system
        const mockUser = { id: 'mock-user-id', email: 'user@example.com' };
        setCurrentUser(mockUser);
        
        // Fetch user profile from your database
        // const response = await fetch('/api/user/profile');
        // const profile = await response.json();
        // setUserProfile(profile);
        
        // For demo, simulate profile data
        setUserProfile({
          subscription_tier: 'free' // This would come from your database
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'per month',
      description: 'For hobbyists and students',
      features: [
        '3 Datasets',
        'Basic Cleaning Agents',
        '100MB Storage',
        'Community Support',
      ],
      popular: false,
      buttonVariant: 'outline' as const,
      currentPlan: userProfile?.subscription_tier === 'free',
      priceId: 'price_free_default',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For professional data scientists',
      features: [
        'Unlimited Datasets',
        'Advanced AI Agents (Groq Llama 3)',
        '10GB Storage',
        'Priority Support',
        'API Access',
      ],
      popular: true,
      buttonVariant: 'default' as const,
      currentPlan: userProfile?.subscription_tier === 'pro',
      priceId: 'price_pro_monthly',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large teams and organizations',
      features: [
        'Everything in Pro',
        'Custom AI Models',
        '1TB Storage',
        '24/7 Dedicated Support',
        'SSO & Audit Logs',
      ],
      popular: false,
      buttonVariant: 'outline' as const,
      currentPlan: userProfile?.subscription_tier === 'enterprise',
      priceId: 'price_enterprise_monthly',
    },
  ];

  const handleSubscribe = async (planId: string, priceId: string) => {
    if (!currentUser) {
      alert('Please sign in to subscribe to a plan');
      window.location.href = '/sign-in';
      return;
    }
    
    try {
      // This would call your Stripe checkout API
      const response = await fetch(`/api/stripe/checkout?user_id=${currentUser.id}&price_id=${priceId}&return_url=${encodeURIComponent(window.location.origin + '/dashboard/subscription')}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
        return;
      }
      
      const data = await response.json();
      
      // In a real implementation, redirect to Stripe checkout
      // window.location.href = data.checkoutUrl;
      
      // For demo purposes, just show a message
      alert(`Would redirect to payment for ${planId} plan`);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error creating checkout session');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your data science needs. All plans include core features with additional benefits as you scale.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`flex flex-col ${plan.popular ? 'ring-2 ring-primary relative' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <SparklesIcon className="h-4 w-4" />
                    Most Popular
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.buttonVariant}
                    onClick={() => handleSubscribe(plan.id, plan.priceId)}
                    disabled={plan.currentPlan}
                  >
                    {plan.currentPlan 
                      ? 'Current Plan' 
                      : plan.id === 'enterprise' 
                        ? 'Contact Sales' 
                        : 'Subscribe'
                    }
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-12 text-center text-sm text-muted-foreground max-w-3xl mx-auto">
          <p className="mb-2">
            <strong>Billed monthly.</strong> All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p>
            Need a custom plan? <a href="/contact" className="text-primary hover:underline">Contact sales</a> for enterprise solutions.
          </p>
        </div>
      </div>
    </div>
  );
}
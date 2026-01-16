"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, CreditCardIcon } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile } from "@/lib/db/services";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  subscription_tier: string;
  credits_remaining: number;
  storage_used_mb: number;
  id: string;
  full_name: string;
  email: string;
}

export default function SubscriptionPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  // For Clerk Billing integration, we would typically use the useUser hook
  // const { user } = useUser(); // Uncomment when Clerk is properly installed

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const data = await getUserProfile(user.id);
      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = (plan: string) => {
    // In a real implementation with Clerk Billing, this would redirect to Clerk's payment flow
    // For example: redirectToBilling({ planId: plan });
    
    // For now, we'll show a message indicating the integration
    toast.info(`Redirecting to Clerk Billing for ${plan} plan upgrade`);
    
    // Example of how this would work with Clerk Billing:
    // if (typeof window !== 'undefined') {
    //   window.location.href = `/api/billing/upgrade?plan=${plan}`;
    // }
    
    // In a complete Clerk Billing integration:
    // 1. Call Clerk's billing API to initiate checkout
    // 2. Upon successful payment, Clerk would send webhook to update user's subscription
    // 3. The webhook would update the user's tier in the Supabase profiles table
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "per month",
      tier: "free",
      features: [
        "3 Datasets",
        "Basic Cleaning Agents",
        "100MB Storage",
        "Community Support"
      ],
      buttonText: "Current Plan",
      buttonVariant: "outline" as const,
      popular: false,
      clerkPlanId: "free" // Clerk Billing plan ID would go here
    },
    {
      name: "Pro",
      price: "$29",
      period: "per month",
      tier: "pro",
      features: [
        "Unlimited Datasets",
        "Advanced AI Agents (Groq Llama 3)",
        "10GB Storage",
        "Priority Support",
        "API Access"
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "default" as const,
      popular: true,
      clerkPlanId: "pro" // Clerk Billing plan ID would go here
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      tier: "premium",
      features: [
        "Everything in Pro",
        "Custom AI Models",
        "1TB Storage",
        "24/7 Dedicated Support",
        "SSO & Audit Logs"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false,
      clerkPlanId: "enterprise" // Clerk Billing plan ID would go here
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentTier = profile?.subscription_tier || 'free';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your plan and usage
        </p>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Storage Usage</CardTitle>
            <CardDescription>Current storage consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {profile?.storage_used_mb?.toFixed(2) || '0'} MB
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((profile?.storage_used_mb || 0) / 100 * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-sm text-muted-foreground">
                {(profile?.storage_used_mb || 0).toFixed(2)} MB of 100 MB used
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credits Remaining</CardTitle>
            <CardDescription>Available processing credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.credits_remaining || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Credits reset monthly
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <CardDescription>Your subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge 
              className={`text-lg px-3 py-1 ${
                currentTier === 'free' ? 'bg-blue-100 text-blue-800' :
                currentTier === 'pro' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}
            >
              {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${
                plan.popular 
                  ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <CardDescription>
                  {plan.name === 'Free' ? 'For hobbyists and students' :
                   plan.name === 'Pro' ? 'For professional data scientists' :
                   'For large teams and organizations'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={plan.buttonVariant}
                  onClick={() => handleUpgradePlan(plan.name)}
                  disabled={currentTier === plan.tier}
                >
                  {currentTier === plan.tier ? (
                    <>
                      <CheckIcon className="mr-2 h-4 w-4" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      {plan.buttonText}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
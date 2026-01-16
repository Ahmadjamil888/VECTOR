import { createClient } from '@supabase/supabase-js';

export interface UserPlanLimits {
  maxDatasets: number;
  maxStorageMB: number;
  hasAdvancedAgents: boolean;
  hasAPiAccess: boolean;
  hasCustomModels: boolean;
  hasSSO: boolean;
}

export class PlanLimitService {
  // Get plan limits based on subscription tier
  static getPlanLimits(subscriptionTier: string): UserPlanLimits {
    switch (subscriptionTier) {
      case 'pro':
        return {
          maxDatasets: Infinity, // Unlimited
          maxStorageMB: 10 * 1024, // 10GB
          hasAdvancedAgents: true,
          hasAPiAccess: true,
          hasCustomModels: false,
          hasSSO: false
        };
      case 'enterprise':
        return {
          maxDatasets: Infinity, // Unlimited
          maxStorageMB: 1024 * 1024, // 1TB
          hasAdvancedAgents: true,
          hasAPiAccess: true,
          hasCustomModels: true,
          hasSSO: true
        };
      case 'free':
      default:
        return {
          maxDatasets: 3,
          maxStorageMB: 100, // 100MB
          hasAdvancedAgents: false,
          hasAPiAccess: false,
          hasCustomModels: false,
          hasSSO: false
        };
    }
  }

  // Check if user can upload a new dataset based on their plan
  static async canUserUploadDataset(userId: string): Promise<{ canUpload: boolean; reason?: string }> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key for admin operations
    );

    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, storage_used_mb')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return { canUpload: false, reason: 'Could not verify user profile' };
    }

    // Get current dataset count for user
    const { count: datasetCount, error: countError } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting user datasets:', countError);
      return { canUpload: false, reason: 'Could not verify dataset count' };
    }

    const planLimits = this.getPlanLimits(profile.subscription_tier);

    // Check dataset limit
    if (datasetCount && datasetCount >= planLimits.maxDatasets) {
      return { 
        canUpload: false, 
        reason: `Dataset limit reached (${planLimits.maxDatasets}). Upgrade to upload more.` 
      };
    }

    return { canUpload: true };
  }

  // Check if user has access to advanced features
  static hasAdvancedFeatureAccess(userId: string, feature: keyof UserPlanLimits): Promise<boolean> {
    return new Promise(async (resolve) => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key for admin operations
      );

      // Get user profile to check subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        resolve(false);
        return;
      }

      const planLimits = this.getPlanLimits(profile.subscription_tier);
      resolve(!!planLimits[feature]);
    });
  }

  // Check if user has access to specific features
  static async hasFeatureAccess(userId: string, feature: 'advancedAgents' | 'apiAccess' | 'customModels' | 'sso'): Promise<boolean> {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key for admin operations
    );

    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return false;
    }

    const planLimits = this.getPlanLimits(profile.subscription_tier);

    switch (feature) {
      case 'advancedAgents':
        return planLimits.hasAdvancedAgents;
      case 'apiAccess':
        return planLimits.hasAPiAccess;
      case 'customModels':
        return planLimits.hasCustomModels;
      case 'sso':
        return planLimits.hasSSO;
      default:
        return false;
    }
  }
}
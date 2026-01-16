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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SaveIcon, UserIcon, CreditCardIcon } from "lucide-react";
import { getUserProfile, updateUserProfile } from "@/lib/db/services";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  subscription_tier: string;
  credits_remaining: number;
  storage_used_mb: number;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const data = await getUserProfile(user.id);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      await updateUserProfile(user.id, {
        full_name: profile.full_name,
        bio: profile.bio,
      });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and account settings
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <CreditCardIcon className="mr-2 h-4 w-4" />
            Subscription
          </Button>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed here. Update through authentication settings.
                </p>
              </div>
              
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile?.full_name || ''}
                  onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile?.bio || ''}
                  onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label>Subscription Tier</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 bg-secondary rounded-full text-sm font-medium">
                    {profile?.subscription_tier || 'free'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {profile?.credits_remaining || 0} credits remaining
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Details about your account and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Member since</Label>
                  <p className="font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Storage used</Label>
                  <p className="font-medium">
                    {profile?.storage_used_mb ? `${profile.storage_used_mb.toFixed(2)} MB` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile}
              disabled={saving}
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
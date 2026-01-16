"use client"

import { useState, useEffect } from "react";
import { FileTextIcon, TrendingUpIcon, ShareIcon } from "lucide-react";
import { SimpleUploadForm } from "@/components/simple-upload-form";
import { toast } from "sonner";
import { getDashboardStats } from "@/lib/db/services";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalDatasets: number;
  storageUsed: number;
  totalPublished: number;
  recentActivity: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const dashboardStats = await getDashboardStats(user.id);
      
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Your data science workspace statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileTextIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Datasets</div>
              <div className="text-2xl font-bold">{stats?.totalDatasets || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active datasets</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUpIcon className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
              <div className="text-2xl font-bold">{(stats?.storageUsed || 0).toFixed(2)}MB</div>
              <p className="text-xs text-muted-foreground mt-1">of 100MB allocated</p>
              <div className="mt-2 h-2 w-full rounded bg-muted">
                <div 
                  className="h-2 bg-primary rounded" 
                  style={{ width: `${Math.min(((stats?.storageUsed || 0) / 100) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ShareIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Published</div>
              <div className="text-2xl font-bold">{stats?.totalPublished || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Public datasets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Dataset Growth</h3>
          <div className="h-64 flex items-center justify-center rounded-lg border bg-muted/20">
            <p className="text-muted-foreground">Chart visualization coming soon</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Storage Usage</h3>
          <div className="h-64 flex items-center justify-center rounded-lg border bg-muted/20">
            <p className="text-muted-foreground">Storage chart coming soon</p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <SimpleUploadForm />

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {activity.file_size_mb ? `${activity.file_size_mb.toFixed(2)} MB` : 'N/A'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

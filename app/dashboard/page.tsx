"use client"

import { useState, useEffect } from "react";
import { FileTextIcon, TrendingUpIcon, ShareIcon } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { DatasetService } from "@/lib/dataset-service";
import { supabase } from "@/lib/supabase";
// import { auth } from "@clerk/nextjs/server"; // Commented out due to module issues

interface DashboardStats {
  totalDatasets: number;
  totalStorage: number;
  recentDatasets: number;
  storageLimit: number;
  storagePercentage: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Authentication error:', userError);
        toast.error('User not authenticated');
        // Set default stats instead of throwing
        setStats({
          totalDatasets: 0,
          totalStorage: 0,
          recentDatasets: 0,
          storageLimit: 100,
          storagePercentage: 0
        });
        return;
      }

      setUserId(user.id);
      
      const userStats = await DatasetService.getUserDatasetStats(user.id);
      
      setStats({
        totalDatasets: userStats.totalDatasets,
        totalStorage: userStats.totalStorage,
        recentDatasets: userStats.recentDatasets,
        storageLimit: userStats.storageLimit,
        storagePercentage: userStats.storagePercentage
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default stats instead of showing error to prevent dashboard crashes
      setStats({
        totalDatasets: 0,
        totalStorage: 0,
        recentDatasets: 0,
        storageLimit: 100,
        storagePercentage: 0
      });
      toast.error('Failed to load dashboard statistics. Showing default values.');
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
              <div className="text-2xl font-bold">{(stats?.totalStorage || 0).toFixed(2)}MB</div>
              <p className="text-xs text-muted-foreground mt-1">of {stats?.storageLimit || 100}MB allocated</p>
              <div className="mt-2 h-2 w-full rounded bg-muted">
                <div 
                  className="h-2 bg-primary rounded" 
                  style={{ width: `${stats?.storagePercentage || 0}%` }} 
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
              <div className="text-sm text-muted-foreground">Recent Datasets</div>
              <div className="text-2xl font-bold">{stats?.recentDatasets || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
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
      {userId && (
        <FileUpload 
          userId={userId} 
          onUploadComplete={(datasetId) => {
            // Refresh stats after upload
            fetchDashboardStats();
            toast.success('Dataset uploaded successfully!');
          }}
        />
      )}

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Storage Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Datasets</p>
              <p className="text-2xl font-bold">{stats?.totalDatasets || 0}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold">{(stats?.totalStorage || 0).toFixed(2)}MB</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>You have used {(stats?.storagePercentage || 0).toFixed(1)}% of your {stats?.storageLimit || 100}MB storage limit.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

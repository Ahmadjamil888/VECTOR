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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChartIcon, DatabaseIcon, ZapIcon, TrendingUpIcon } from "lucide-react";
import { toast } from "sonner";
import { getUserUsageStats } from "@/lib/db/services";
import { createClient } from "@/lib/supabase/client";

interface UsageStats {
  total_datasets: number;
  total_chats: number;
  total_messages: number;
  storage_used_mb: number;
  credits_used: number;
  credits_remaining: number;
  recent_activity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export default function UsagePage() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const usageStats = await getUserUsageStats(user.id);
      setUsageStats(usageStats);

    } catch (error) {
      console.error('Error fetching usage stats:', error);
      toast.error('Failed to load usage statistics');
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
        <h1 className="text-3xl font-bold">Usage Statistics</h1>
        <p className="text-muted-foreground mt-2">
          Track your platform usage and activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
            <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.total_datasets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active datasets in your workspace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.total_chats || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI conversations initiated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <ZapIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.total_messages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total messages exchanged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.credits_used || 0}</div>
            <p className="text-xs text-muted-foreground">
              {usageStats?.credits_remaining || 0} credits remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>
            Monitor your data storage consumption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Used Storage</span>
                <span>{(usageStats?.storage_used_mb || 0).toFixed(2)} MB</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full" 
                  style={{ 
                    width: `${Math.min((usageStats?.storage_used_mb || 0) / 100 * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(usageStats?.storage_used_mb || 0).toFixed(2)} MB of 100 MB allocated
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest platform interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageStats?.recent_activity && usageStats.recent_activity.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageStats.recent_activity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {activity.description}
                    </TableCell>
                    <TableCell>
                      {new Date(activity.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          activity.metadata?.success 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {activity.metadata?.success ? "Success" : "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <BarChartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No activity yet</h3>
              <p className="mt-2 text-muted-foreground">
                Your activity will appear here once you start using the platform
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Data */}
      <div className="flex justify-end">
        <Button variant="outline">
          Export Usage Report
        </Button>
      </div>
    </div>
  );
}
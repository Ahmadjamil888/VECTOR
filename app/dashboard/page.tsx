"use client"

import { FileTextIcon, TrendingUpIcon, ShareIcon } from "lucide-react";
import { SimpleUploadForm } from "@/components/simple-upload-form";

export default function DashboardPage() {
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
              <div className="text-2xl font-bold">0</div>
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
              <div className="text-2xl font-bold">0MB</div>
              <p className="text-xs text-muted-foreground mt-1">of 100MB allocated</p>
              <div className="mt-2 h-2 w-full rounded bg-muted">
                <div className="h-2 bg-primary rounded" style={{ width: "0%" }} />
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
              <div className="text-2xl font-bold">0</div>
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
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </div>
        </div>
      </div>
    </div>
  );
}

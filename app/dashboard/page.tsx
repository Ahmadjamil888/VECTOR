import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.firstName || 'there'}!</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your data projects today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <div className="text-sm text-muted-foreground">Datasets</div>
          <div className="mt-2 text-2xl font-bold">12</div>
          <p className="mt-2 text-sm text-muted-foreground">Active datasets in your workspace</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="text-sm text-muted-foreground">Storage Used</div>
          <div className="mt-2 text-2xl font-bold">45MB</div>
          <p className="mt-2 text-sm text-muted-foreground">of 100MB allocated</p>
          <div className="mt-3 h-2 w-full rounded bg-muted">
            <div className="h-2 bg-primary rounded" style={{ width: "45%" }} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="text-sm text-muted-foreground">Published</div>
          <div className="mt-2 text-2xl font-bold">3</div>
          <p className="mt-2 text-sm text-muted-foreground">Datasets shared publicly</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Recent Activity</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="text-sm">Dataset cleaned: sales_data.csv</div>
              <div className="text-xs text-muted-foreground">2 hours ago</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="text-sm">New dataset uploaded</div>
              <div className="text-xs text-muted-foreground">1 day ago</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="text-sm">Published quarterly_report.csv</div>
              <div className="text-xs text-muted-foreground">3 days ago</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Quick Actions</div>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="font-medium">Upload New Dataset</div>
              <div className="text-sm text-muted-foreground">Import CSV, JSON, or Excel files</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="font-medium">Create Data Pipeline</div>
              <div className="text-sm text-muted-foreground">Build automated cleaning workflows</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="font-medium">Publish Dataset</div>
              <div className="text-sm text-muted-foreground">Share with the community</div>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-card border-4 border-primary/30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b-4 border-border/60 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-muted-foreground">Data Editor</span>
          </div>
        </div>
        <div className="p-4">
          <div className="rounded-lg border p-4 font-mono text-sm">
            <div className="text-muted-foreground"># Select a dataset to start editing</div>
            <div className="mt-2">No dataset selected</div>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm">
              Choose Dataset
            </button>
            <button className="border px-4 py-2 rounded-lg text-sm">
              Upload New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
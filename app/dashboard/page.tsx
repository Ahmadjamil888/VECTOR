import { Button } from "@/components/ui/button";
import { FileTextIcon, DatabaseIcon, ShareIcon, TrendingUpIcon, ShieldIcon, UsersIcon } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 h-16 flex items-center border-b sticky top-0 z-50 bg-background/80 backdrop-blur">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">V</div>
          <span>Vector</span>
        </div>
        <nav className="ml-8 hidden md:flex gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground">Features</a>
          <a href="#" className="text-muted-foreground hover:text-foreground">Enterprise</a>
          <a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="#" className="text-muted-foreground hover:text-foreground">Resources</a>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Button variant="outline" className="rounded-full px-4">Sign in</Button>
          <Button className="rounded-full px-4">Get started free</Button>
        </div>
      </header>
      <main className="px-6 md:px-10 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Enterprise Data Workspace</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl">AI-powered data science platform for teams. Clean, analyze, and publish datasets with enterprise-grade security and governance.</p>
        <p className="mt-2 text-sm text-muted-foreground">Built for data scientists, analysts, and ML engineers at scale.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileTextIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Datasets</div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Active datasets in workspace</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
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
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ShareIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Published</div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Datasets shared publicly</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm text-muted-foreground mb-4">Quick Actions</div>
          <div className="space-y-3">
            <Button className="w-full justify-start h-auto py-3 px-4">
              <FileTextIcon className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Upload New Dataset</div>
                <div className="text-sm text-muted-foreground">Import CSV, JSON, or Excel files</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" disabled>
              <DatabaseIcon className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Create Data Pipeline</div>
                <div className="text-sm text-muted-foreground">Build automated cleaning workflows</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start h-auto py-3 px-4" disabled>
              <ShareIcon className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Publish Dataset</div>
                <div className="text-sm text-muted-foreground">Share with the community</div>
              </div>
            </Button>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm text-muted-foreground mb-4">Enterprise Features</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <ShieldIcon className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Security Controls</div>
                <div className="text-xs text-muted-foreground">SSO, RBAC, audit logs</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <UsersIcon className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Team Collaboration</div>
                <div className="text-xs text-muted-foreground">Shared workspaces, reviews</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <TrendingUpIcon className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-sm font-medium">Governance</div>
                <div className="text-xs text-muted-foreground">Policy enforcement, compliance</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm text-muted-foreground mb-4">Your Datasets</div>
          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/dashboard/datasets'}
            >
              View All Datasets
            </Button>
            <div className="text-xs text-muted-foreground p-3 rounded-lg border bg-muted/20">
              <div className="font-medium mb-1">Storage Summary</div>
              <div>0 datasets • 0MB used</div>
              <div className="mt-1 h-1 w-full rounded bg-muted">
                <div className="h-1 bg-primary rounded" style={{ width: "0%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border-4 border-primary/30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b-4 border-border/60 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-muted-foreground">Enterprise Dashboard</span>
          </div>
          <div className="text-xs text-muted-foreground">Ready for production</div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold mb-2">Get Started with Enterprise Data Science</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Upload your first dataset to unlock AI-powered data cleaning, transformation, and publishing capabilities with enterprise-grade security.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="px-8">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Upload Dataset
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                View Demo
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-8 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">256-bit</div>
              <div className="text-sm text-muted-foreground">Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">SOC 2</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </main>
    </div>
  );
}
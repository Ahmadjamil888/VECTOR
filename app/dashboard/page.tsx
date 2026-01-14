import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadDialog } from "@/components/upload-dialog";
import { FileTextIcon, DatabaseIcon, ShareIcon } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to Vector</h1>
        <p className="text-muted-foreground mt-2">Upload a dataset to start working with AI-powered data editing.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardDescription>Datasets</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
            <p className="text-sm text-muted-foreground">Active datasets in your workspace</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Storage Used</CardDescription>
            <CardTitle className="text-2xl">0MB</CardTitle>
            <p className="text-sm text-muted-foreground">of 100MB allocated</p>
            <div className="mt-3 h-2 w-full rounded bg-muted">
              <div className="h-2 bg-primary rounded" style={{ width: "0%" }} />
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl">0</CardTitle>
            <p className="text-sm text-muted-foreground">Datasets shared publicly</p>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start working with your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <UploadDialog>
              <Button className="w-full justify-start h-auto py-3 px-4">
                <FileTextIcon className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Upload New Dataset</div>
                  <div className="text-sm text-muted-foreground">Import CSV, JSON, or Excel files</div>
                </div>
              </Button>
            </UploadDialog>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Datasets</CardTitle>
            <CardDescription>Manage your data collections</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/dashboard/datasets'}
            >
              View All Datasets
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center py-12 text-muted-foreground">
        <p>Upload a dataset to get started with the AI-powered data editor</p>
        <div className="mt-4">
          <UploadDialog>
            <Button size="lg">
              Upload Dataset
            </Button>
          </UploadDialog>
        </div>
      </div>
    </div>
  );
}
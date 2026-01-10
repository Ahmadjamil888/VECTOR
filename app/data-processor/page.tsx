import DataProcessor from '@/components/DataProcessor';

export default function DataProcessorPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">AI Data Processor</h1>
          </div>
        </div>
      </header>
      
      <main className="container py-8">
        <DataProcessor />
      </main>
    </div>
  );
}
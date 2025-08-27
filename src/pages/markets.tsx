import { MarketTable } from '@/components/MarketTable';
import Navigation from '@/components/Navigation';

export default function Markets() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">
              Lending & Borrowing Markets
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the best rates for lending and borrowing across supported assets
            </p>
          </div>

          <MarketTable />
        </div>
      </main>
    </div>
  );
}
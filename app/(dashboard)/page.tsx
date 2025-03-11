export const runtime = 'edge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsTable } from './products-table';
import { getProducts } from '@/lib/db';
import Link from 'next/link'

// This matches the original type that was working before
export default async function ProductsPage(
  props: {
    searchParams: Promise<{ q: string; offset: string }>;
  }
) {
  const searchParams = await props.searchParams;
  // Always use empty string for search now that we've removed the search bar
  const search = ''; // Removed searchParams.q ?? '';
  const offsetParam = searchParams.offset;
  const offset = offsetParam ? parseInt(offsetParam) : 0;
  
  // Handle invalid offset values
  const safeOffset = Number.isNaN(offset) ? 0 : offset;
  
  const { products, totalProducts } = await getProducts(search, safeOffset);

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived" className="hidden sm:flex">
            Archived
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Link href="/products/add">
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Product
              </span>
            </Button>
          </Link>
        </div>
      </div>
      <TabsContent value="all">
        <ProductsTable
          initialProducts={products}
          initialOffset={safeOffset}
          totalProducts={totalProducts}
        />
      </TabsContent>
    </Tabs>
  );
}

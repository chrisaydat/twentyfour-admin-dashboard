'use client';

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Plus, Pencil, Trash } from 'lucide-react'
import { deleteProduct } from './actions'

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  stock: number;
  status: 'active' | 'inactive' | 'archived';
};

export default function ProductsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Fetch products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*')
        
        if (error) {
          console.error('Error fetching products:', error)
          setError('Failed to load products. Please try again.')
          return
        }
        
        setProducts(data || [])
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [supabase])

  const handleDelete = async (id: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }
    
    setDeleting(id)
    
    try {
      // Create form data with the ID
      const formData = new FormData()
      formData.append('id', id)
      
      // Call the server action
      const result = await deleteProduct(formData)
      
      if (result.success) {
        // Remove the product from the local state
        setProducts(products.filter(product => product.id !== id))
      } else {
        console.error('Error deleting product:', result.error)
        alert(`Failed to delete product: ${result.error}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('An unexpected error occurred while deleting the product.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 h-64 justify-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.refresh()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Link href="/products/add">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Price</TableHead>
              <TableHead className="hidden md:table-cell">Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="aspect-square rounded-md object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {product.status || 'active'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {product.stock || 0}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-label="Open menu" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/products/${product.id}/edit`} className="flex w-full items-center">
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit Product</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="text-destructive"
                      >
                        <div className="flex w-full items-center">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>{deleting === product.id ? 'Deleting...' : 'Delete Product'}</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!products.length && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
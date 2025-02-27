'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadProductImage } from '@/lib/storage'
import { Link } from '@/components/ui/link'
import { SupabaseAuthHelper } from '@/lib/supabase/auth-helper'

export default function AddProductPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSettingUpCategories, setIsSettingUpCategories] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const authHelper = SupabaseAuthHelper.getInstance()

  type Category = {
    id: number;
    name: string;
    parent_id: number | null;
    slug: string;
  }

  const [categories, setCategories] = useState<Category[]>([])

  // Initialize auth helper and check session
  useEffect(() => {
    const init = async () => {
      await authHelper.initialize()
      const { session, error: authError } = await authHelper.getSession()
      
      if (authError || !session) {
        console.error('Auth error:', authError)
        router.push('/auth/login')
        return
      }
    }

    init()
  }, [])

  // Group categories by parent
  const groupedCategories = categories.reduce<Record<number, { parent: Category; children: Category[] }>>((acc, category) => {
    if (!category.parent_id) {
      return {
        ...acc,
        [category.id]: {
          parent: category,
          children: categories.filter(c => c.parent_id === category.id)
        }
      }
    }
    return acc
  }, {})

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // First try with the auth helper (handles retries and token refresh)
        const { data, error: fetchError } = await authHelper.executeWithRetry<Category[]>(
          async () => {
            const result = await supabase
              .from('categories')
              .select('id, name, parent_id, slug')
              .order('name')
            return { data: result.data, error: result.error }
          },
          'fetch_categories'
        )
        
        if (fetchError) {
          console.error('Error fetching categories with auth helper:', fetchError)
          throw fetchError
        }
        
        if (data && data.length > 0) {
          console.log(`Loaded ${data.length} categories successfully`)
          setCategories(data)
          return
        }

        // If no categories were found, try a direct approach
        console.log('No categories found with auth helper, trying direct fetch')
        const { data: directData, error: directError } = await supabase
          .from('categories')
          .select('id, name, parent_id, slug')
          .order('name')
        
        if (directError) {
          console.error('Error with direct fetch:', directError)
          throw directError
        }
        
        if (directData && directData.length > 0) {
          console.log(`Loaded ${directData.length} categories with direct fetch`)
          setCategories(directData)
          return
        }
        
        // If still no categories, try checking if the table exists
        console.warn('No categories found. Checking if table exists')
        const { data: tableData, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'categories')
        
        if (tableError) {
          console.error('Error checking if table exists:', tableError)
        } else if (!tableData || tableData.length === 0) {
          setError('Categories table does not exist. Please create it first.')
        } else {
          // Table exists but no data
          setError('No categories found. Please add categories first.')
        }
      } catch (err) {
        console.error('Categories fetch failed:', err)
        setError('Failed to load categories. Please refresh the page or contact support.')
        
        // Last resort - use hardcoded categories if everything else fails
        const fallbackCategories = [
          { id: 1, name: 'Women', parent_id: null, slug: 'women' },
          { id: 2, name: 'Men', parent_id: null, slug: 'men' },
          { id: 3, name: 'Women Bags', parent_id: 1, slug: 'women-bags' },
          { id: 4, name: 'Women Shoes', parent_id: 1, slug: 'women-shoes' },
          { id: 5, name: 'Women Accessories', parent_id: 1, slug: 'women-accessories' },
          { id: 6, name: 'Men Bags', parent_id: 2, slug: 'men-bags' },
          { id: 7, name: 'Men Shoes', parent_id: 2, slug: 'men-shoes' },
          { id: 8, name: 'Men Accessories', parent_id: 2, slug: 'men-accessories' },
        ]
        console.log('Using fallback categories')
        setCategories(fallbackCategories)
      }
    }
    
    fetchCategories()
  }, [])

  // Function to set up categories
  const setupCategories = async () => {
    try {
      setIsSettingUpCategories(true)
      
      const response = await fetch('/api/setup/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to set up categories')
      }
      
      // Fetch categories again after setup
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, name, parent_id, slug')
        .order('name')
      
      if (fetchError) {
        throw fetchError
      }
      
      if (data && data.length > 0) {
        setCategories(data)
        setError(null)
      } else {
        throw new Error('No categories found after setup')
      }
    } catch (err) {
      console.error('Error setting up categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to set up categories')
    } finally {
      setIsSettingUpCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Validate form data
      const name = formData.get('name')
      const description = formData.get('description')
      const price = formData.get('price')
      const category = formData.get('category')
      const imageFile = formData.get('image') as File

      if (!name || !description || !price || !category || !imageFile) {
        throw new Error('All fields are required')
      }

      // Upload image with retry
      let imageUrl
      try {
        imageUrl = await uploadProductImage(imageFile)
        console.log('Upload successful:', imageUrl)
      } catch (uploadError) {
        console.error('Upload failed:', uploadError)
        throw new Error('Failed to upload image')
      }

      // Insert product with retry
      const { error: productError, data: productData } = await authHelper.executeWithRetry(
        async () => {
          const result = await supabase
            .from('products')
            .insert([{
              name,
              description,
              price: parseFloat(price as string),
              category_id: parseInt(category as string),
              image_url: imageUrl
            }])
            .select()
          return { data: result.data, error: result.error }
        },
        'create_product'
      )

      if (productError) {
        console.error('Database Error:', productError)
        throw new Error(productError.message || 'Failed to create product')
      }

      console.log('Success:', productData)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error details:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>
          Create a new product with image and inventory details
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Image</label>
            <Input
              name="image"
              type="file"
              accept="image/*"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              name="name"
              placeholder="Product name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              name="description"
              placeholder="Product description"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price ($)</label>
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="$0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Stock</label>
              <Input
                name="quantity"
                type="number"
                min="0"
                placeholder="0"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            {error && error.includes('categories') ? (
              <div className="mb-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={setupCategories}
                  disabled={isSettingUpCategories}
                >
                  {isSettingUpCategories ? 'Setting up categories...' : 'Set up categories'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to set up default categories
                </p>
              </div>
            ) : null}
            <Select name="category" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(groupedCategories).map(group => (
                  <div key={group.parent.id}>
                    <SelectItem value={group.parent.id.toString()} disabled>
                      {group.parent.name}
                    </SelectItem>
                    {group.children.map((child: Category) => (
                      <SelectItem 
                        key={child.id} 
                        value={child.id.toString()}
                        className="pl-6"
                      >
                        {child.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Creating Product...' : 'Create Product'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 
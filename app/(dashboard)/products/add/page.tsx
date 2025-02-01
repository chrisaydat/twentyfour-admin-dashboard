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

export default function AddProductPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [categories, setCategories] = useState<{id: number, name: string}[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
      
      if (data) setCategories(data)
    }
    
    fetchCategories()
  }, [])

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

      // Log validated data
      console.log('Validated Data:', { name, description, price, category, imageFile })

      // Upload image
      let imageUrl
      try {
        imageUrl = await uploadProductImage(imageFile)
        console.log('Upload successful:', imageUrl)
      } catch (uploadError) {
        console.error('Upload failed:', uploadError)
        throw new Error('Failed to upload image')
      }

      // Insert product
      const { error: productError, data: productData } = await supabase
        .from('products')
        .insert([{
          name,
          description,
          price: parseFloat(price as string),
          category_id: parseInt(category as string),
          image_url: imageUrl
        }])
        .select()

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
              <label className="text-sm font-medium">Price (₵)</label>
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="₵0.00"
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
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
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
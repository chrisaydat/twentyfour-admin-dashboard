import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Default categories to create if none exist
const defaultCategories = [
  { id: 1, name: 'Women', parent_id: null, slug: 'women' },
  { id: 2, name: 'Men', parent_id: null, slug: 'men' },
  { id: 3, name: 'Women Bags', parent_id: 1, slug: 'women-bags' },
  { id: 4, name: 'Women Shoes', parent_id: 1, slug: 'women-shoes' },
  { id: 5, name: 'Women Accessories', parent_id: 1, slug: 'women-accessories' },
  { id: 6, name: 'Men Bags', parent_id: 2, slug: 'men-bags' },
  { id: 7, name: 'Men Shoes', parent_id: 2, slug: 'men-shoes' },
  { id: 8, name: 'Men Accessories', parent_id: 2, slug: 'men-accessories' },
]

export async function GET() {
  try {
    // Initialize Supabase client with server-side auth
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if there's a valid session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if categories table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'categories')
      .single()
    
    if (tableError && tableError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return NextResponse.json(
        { error: 'Failed to check if categories table exists', details: tableError },
        { status: 500 }
      )
    }
    
    // If table doesn't exist, create it
    if (!tableExists) {
      const { error: createTableError } = await supabase.rpc('create_categories_table')
      
      if (createTableError) {
        return NextResponse.json(
          { error: 'Failed to create categories table', details: createTableError },
          { status: 500 }
        )
      }
    }
    
    // Check if categories exist
    const { data: existingCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
    
    if (categoriesError) {
      return NextResponse.json(
        { error: 'Failed to check existing categories', details: categoriesError },
        { status: 500 }
      )
    }
    
    // If no categories, create default ones
    if (!existingCategories || existingCategories.length === 0) {
      const { error: insertError } = await supabase
        .from('categories')
        .insert(defaultCategories)
      
      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create default categories', details: insertError },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Default categories created successfully',
        categories: defaultCategories
      })
    }
    
    // Categories already exist
    return NextResponse.json({
      success: true,
      message: 'Categories already exist',
      count: existingCategories.length
    })
    
  } catch (error) {
    console.error('Setup categories error:', error)
    return NextResponse.json(
      { error: 'Failed to set up categories', details: error },
      { status: 500 }
    )
  }
} 
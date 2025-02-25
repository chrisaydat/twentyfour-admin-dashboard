import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_BUCKET = 'images'

export async function uploadProductImage(file: File) {
  const supabase = createClientComponentClient()
  
  // Create a unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${fileExt}`
  const filePath = fileName // Store directly in the bucket root

  console.log(`Uploading file to ${STORAGE_BUCKET}/${filePath}`)

  // Upload the file
  const { data, error } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading file:', error)
    throw error
  }

  // Get public URL that will work with Next.js Image component
  const { data: { publicUrl } } = supabase
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath)

  console.log(`File uploaded successfully. Public URL: ${publicUrl}`)
  
  // Verify the URL is accessible
  try {
    const response = await fetch(publicUrl, { method: 'HEAD' })
    if (!response.ok) {
      console.error(`Uploaded image URL not accessible: ${publicUrl}, status: ${response.status}`)
    } else {
      console.log(`Verified image URL is accessible: ${publicUrl}`)
    }
  } catch (err) {
    console.error(`Error verifying image URL: ${publicUrl}`, err)
  }

  return publicUrl
}

// Helper function to get public URL for an image
export function getImagePublicUrl(path: string) {
  const supabase = createClientComponentClient()
  
  // Clean the path (remove any product-images/ prefix if it exists)
  const cleanPath = path.replace(/^product-images\/|^\/product-images\//, '')
  
  // Log the path transformation for debugging
  console.log(`Getting public URL for path: ${path} -> ${cleanPath}`)
  
  const { data: { publicUrl } } = supabase
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(cleanPath)
  
  console.log(`Generated public URL: ${publicUrl}`)
  
  return publicUrl
}

// Helper to check if image exists
export async function checkImageExists(path: string) {
  const supabase = createClientComponentClient()
  
  // Clean the path (remove any product-images/ prefix if it exists)
  const cleanPath = path.replace(/^product-images\/|^\/product-images\//, '')
  
  console.log(`Checking if image exists: ${cleanPath}`)
  
  const { data, error } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .download(cleanPath)

  if (error) {
    console.error(`Image does not exist or is not accessible: ${cleanPath}`, error)
  } else {
    console.log(`Image exists and is accessible: ${cleanPath}`)
  }

  return !error
} 
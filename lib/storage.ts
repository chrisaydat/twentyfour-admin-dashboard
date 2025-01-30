import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'

export async function uploadProductImage(file: File) {
  const supabase = createClientComponentClient()
  
  // Create a unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `${uuidv4()}.${fileExt}`
  const filePath = `product-images/${fileName}`

  // Upload the file to Supabase storage
  const { error: uploadError, data } = await supabase.storage
    .from('images')
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath)

  return publicUrl
} 
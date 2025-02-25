import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getImagePublicUrl } from '@/lib/storage'

interface ProductImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}

export function ProductImage({ 
  src, 
  alt, 
  width = 300, 
  height = 300, 
  className 
}: ProductImageProps) {
  const [error, setError] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const fallbackImage = '/images/product-placeholder.png'

  useEffect(() => {
    // Handle different types of src paths
    const url = src.startsWith('http') 
      ? src 
      : getImagePublicUrl(src)
    
    console.log('Image URL:', url)
    setImageUrl(url)

    // Test if the URL is accessible
    if (url.startsWith('http')) {
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.error(`Image URL not accessible: ${url}, status: ${response.status}`)
            setError(true)
          }
        })
        .catch(err => {
          console.error(`Error checking image URL: ${url}`, err)
          setError(true)
        })
    }
  }, [src])

  return (
    <div className={`relative ${className}`}>
      {imageUrl && (
        <Image
          src={error ? fallbackImage : imageUrl}
          alt={alt}
          width={width}
          height={height}
          className="object-cover"
          onError={() => {
            console.error(`Failed to load image: ${imageUrl}`)
            setError(true)
          }}
          priority={false}
          quality={75}
        />
      )}
    </div>
  )
} 
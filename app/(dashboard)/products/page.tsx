import Image from 'next/image'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ProductsPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: products } = await supabase.from('products').select('*')

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>
          <Image
            src={product.image_url}
            alt={product.name}
            width={200}
            height={200}
            className="object-cover"
          />
          {/* other product details */}
        </div>
      ))}
    </div>
  )
}
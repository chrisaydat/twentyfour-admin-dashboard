'use client'

import { StorageTest } from '@/components/storage-test'
import { DirectUrlTest } from '@/components/direct-url-test'

export default function StorageTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Storage Test</h1>
      
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Bucket & File Test</h2>
          <StorageTest />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Direct URL Test</h2>
          <DirectUrlTest />
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Common Issues & Solutions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>400 Bad Request</strong>: Usually means the file doesn't exist or the bucket permissions are incorrect.
            Solution: Check bucket policies and make sure the bucket is set to public.
          </li>
          <li>
            <strong>403 Forbidden</strong>: Access denied due to permissions.
            Solution: Verify your SELECT policy is correctly configured.
          </li>
          <li>
            <strong>CORS Error</strong>: Browser blocks the request due to CORS policy.
            Solution: Add '*' to the CORS origins for your bucket.
          </li>
          <li>
            <strong>Path Issues</strong>: The URL path might be incorrect.
            Solution: Check the exact path of the file in Supabase dashboard.
          </li>
        </ul>
      </div>
    </div>
  )
} 
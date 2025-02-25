import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

export function DirectUrlTest() {
  const [url, setUrl] = useState('')
  const [testUrl, setTestUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const testDirectUrl = async () => {
    if (!url) return
    
    setStatus('loading')
    setErrorMessage('')
    setTestUrl(url)
    
    try {
      const response = await fetch(url, { method: 'HEAD' })
      
      if (response.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(`Status: ${response.status} ${response.statusText}`)
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Failed to fetch URL')
    }
  }
  
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Direct URL Test</h2>
      
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter Supabase storage URL to test"
          className="flex-1"
        />
        <Button onClick={testDirectUrl} disabled={!url || status === 'loading'}>
          Test URL
        </Button>
      </div>
      
      {status !== 'idle' && (
        <div className="space-y-4">
          <div className={`p-2 rounded ${
            status === 'loading' ? 'bg-gray-100' :
            status === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'loading' && 'Testing URL...'}
            {status === 'success' && 'URL is accessible! ✓'}
            {status === 'error' && (
              <div>
                <div>URL is not accessible ✗</div>
                {errorMessage && <div className="text-sm mt-1">{errorMessage}</div>}
              </div>
            )}
          </div>
          
          {status === 'success' && (
            <div className="border p-2 rounded">
              <h3 className="font-medium mb-2">Image Preview:</h3>
              <div className="relative h-48 bg-gray-100">
                <Image
                  src={testUrl}
                  alt="Test image"
                  fill
                  className="object-contain"
                  onError={() => {
                    setStatus('error')
                    setErrorMessage('Image loaded but could not be displayed')
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="text-sm text-gray-600 mt-4">
        <h3 className="font-medium">Troubleshooting Tips:</h3>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Make sure the bucket is set to public</li>
          <li>Check that CORS is properly configured</li>
          <li>Verify the SELECT policy is correctly set up</li>
          <li>Try accessing the URL directly in a new browser tab</li>
          <li>Check for any path issues in the URL</li>
        </ul>
      </div>
    </div>
  )
} 
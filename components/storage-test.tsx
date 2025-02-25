import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'

export function StorageTest() {
  const [buckets, setBuckets] = useState<string[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('images')
  const [files, setFiles] = useState<any[]>([])
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  
  // List all buckets
  const listBuckets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.storage.listBuckets()
      
      if (error) {
        throw error
      }
      
      setBuckets(data.map(bucket => bucket.name))
    } catch (err: any) {
      console.error('Error listing buckets:', err)
      setError(err.message || 'Failed to list buckets')
    } finally {
      setLoading(false)
    }
  }
  
  // List files in selected bucket
  const listFiles = async () => {
    if (!selectedBucket) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .list()
      
      if (error) {
        throw error
      }
      
      setFiles(data || [])
    } catch (err: any) {
      console.error(`Error listing files in ${selectedBucket}:`, err)
      setError(err.message || `Failed to list files in ${selectedBucket}`)
    } finally {
      setLoading(false)
    }
  }
  
  // Test file access
  const testFileAccess = async (path: string) => {
    try {
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(selectedBucket)
        .getPublicUrl(path)
      
      console.log(`Testing URL: ${publicUrl}`)
      
      // Test if accessible
      const response = await fetch(publicUrl, { method: 'HEAD' })
      const isAccessible = response.ok
      
      setTestResults(prev => ({
        ...prev,
        [path]: isAccessible
      }))
      
      return isAccessible
    } catch (err) {
      console.error(`Error testing file access for ${path}:`, err)
      setTestResults(prev => ({
        ...prev,
        [path]: false
      }))
      return false
    }
  }
  
  // Test all files
  const testAllFiles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const results = await Promise.all(
        files.map(file => testFileAccess(file.name))
      )
      
      const successCount = results.filter(Boolean).length
      console.log(`${successCount} of ${results.length} files are accessible`)
    } catch (err: any) {
      console.error('Error testing files:', err)
      setError(err.message || 'Failed to test files')
    } finally {
      setLoading(false)
    }
  }
  
  // Initialize
  useEffect(() => {
    listBuckets()
  }, [])
  
  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Storage Test</h2>
      
      {error && (
        <div className="p-2 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="font-medium">Buckets:</h3>
        <div className="flex flex-wrap gap-2">
          {buckets.map(bucket => (
            <Button
              key={bucket}
              variant={selectedBucket === bucket ? "default" : "outline"}
              onClick={() => setSelectedBucket(bucket)}
              size="sm"
            >
              {bucket}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <Button 
          onClick={listFiles} 
          disabled={!selectedBucket || loading}
        >
          List Files in {selectedBucket}
        </Button>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="font-medium">Files in {selectedBucket}:</h3>
            <Button 
              onClick={testAllFiles} 
              disabled={loading}
              size="sm"
            >
              Test All Files
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded p-2">
            <ul className="space-y-1">
              {files.map(file => (
                <li key={file.name} className="flex items-center justify-between">
                  <span className="truncate">{file.name}</span>
                  <div className="flex items-center gap-2">
                    {testResults[file.name] !== undefined && (
                      <span className={testResults[file.name] ? "text-green-600" : "text-red-600"}>
                        {testResults[file.name] ? "✓" : "✗"}
                      </span>
                    )}
                    <Button 
                      onClick={() => testFileAccess(file.name)} 
                      size="sm" 
                      variant="outline"
                    >
                      Test
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
} 
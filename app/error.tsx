'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-md flex-col space-y-4 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Something went wrong!</h1>
          <p className="text-gray-500">
            An unexpected error occurred. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-red-50 p-4 text-left">
              <p className="text-sm text-red-800">{error.message}</p>
            </div>
          )}
        </div>
        <Button onClick={() => reset()} className="mx-auto w-full max-w-xs">
          Try again
        </Button>
      </div>
    </div>
  );
} 
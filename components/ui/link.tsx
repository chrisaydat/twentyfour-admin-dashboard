import NextLink, { LinkProps } from 'next/link'
import { cn } from '@/lib/utils'
import React from 'react'

export function Link({ className, ...props }: LinkProps & { className?: string }) {
  return <NextLink className={cn("text-primary hover:underline", className)} {...props} />
} 
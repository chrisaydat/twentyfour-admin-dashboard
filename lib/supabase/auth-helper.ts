import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

// Exponential backoff delay calculation with longer initial delay
const getBackoffDelay = (retryCount: number) => Math.min(2000 * Math.pow(2, retryCount), 15000)

export class SupabaseAuthHelper {
  private static instance: SupabaseAuthHelper
  private supabase: SupabaseClient
  private isRefreshing = false
  private retryCount = 0
  private maxRetries = 2 // Reduced max retries
  private cachedSession: any = null
  private lastSessionCheck = 0
  private sessionCheckInterval = 30000 // 30 seconds

  private constructor() {
    this.supabase = createClientComponentClient()
    // Initialize auth listener immediately
    this.initializeAuthListener()
  }

  public static getInstance(): SupabaseAuthHelper {
    if (!SupabaseAuthHelper.instance) {
      SupabaseAuthHelper.instance = new SupabaseAuthHelper()
    }
    return SupabaseAuthHelper.instance
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async initializeAuthListener() {
    if (!this.supabase) return

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.cachedSession = session
        this.lastSessionCheck = Date.now()
      } else if (event === 'SIGNED_OUT') {
        this.cachedSession = null
        this.lastSessionCheck = 0
      }
    })
  }

  public async initialize() {
    await this.initializeAuthListener()
    await this.getSession() // Initial session check
  }

  public async getSession() {
    // Use cached session if it's recent enough
    if (this.cachedSession && Date.now() - this.lastSessionCheck < this.sessionCheckInterval) {
      return { session: this.cachedSession, error: null }
    }

    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        // If cached session exists, return it even if there's an error
        if (this.cachedSession) {
          return { session: this.cachedSession, error: null }
        }
        return { session: null, error }
      }

      this.cachedSession = session
      this.lastSessionCheck = Date.now()
      return { session, error: null }
    } catch (error) {
      console.error('Get session error:', error)
      // Return cached session as fallback
      if (this.cachedSession) {
        return { session: this.cachedSession, error: null }
      }
      return { session: null, error }
    }
  }

  public async refreshSession() {
    if (this.isRefreshing) {
      await this.wait(2000) // Increased wait time
      return this.getSession()
    }

    try {
      this.isRefreshing = true
      
      // Check if we really need to refresh
      const currentSession = await this.getSession()
      if (currentSession.session?.expires_at) {
        const expiresAt = new Date(currentSession.session.expires_at).getTime()
        // If session is not close to expiring, don't refresh
        if (Date.now() < expiresAt - 60000) { // 1 minute buffer
          return currentSession
        }
      }

      const { data: { session }, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        console.error('Refresh error:', error)
        return { session: null, error }
      }

      this.cachedSession = session
      this.lastSessionCheck = Date.now()
      this.retryCount = 0
      return { session, error: null }
    } catch (error) {
      console.error('Refresh session error:', error)
      return { session: null, error }
    } finally {
      this.isRefreshing = false
    }
  }

  public async executeWithRetry<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<{ data: T | null; error: any }> {
    // Initial delay before first attempt
    await this.wait(500)

    while (this.retryCount < this.maxRetries) {
      try {
        // Check session before operation
        const { session } = await this.getSession()
        if (!session) {
          return { 
            data: null, 
            error: new Error('No valid session found') 
          }
        }

        const result = await operation()

        if (!result.error) {
          this.retryCount = 0
          return result
        }

        // Handle specific error types
        if (result.error.status === 429) {
          const delay = getBackoffDelay(this.retryCount)
          console.warn(`Rate limit hit for ${context}. Retrying in ${delay}ms`)
          await this.wait(delay)
          this.retryCount++
          continue
        }

        if (result.error.status === 401 || result.error.status === 400) {
          const { session, error: refreshError } = await this.refreshSession()
          if (session && !refreshError) {
            await this.wait(1000) // Wait after refresh
            this.retryCount++
            continue
          }
        }

        return result
      } catch (error) {
        console.error(`Error in ${context}:`, error)
        return { data: null, error }
      }
    }

    this.retryCount = 0
    return { 
      data: null, 
      error: new Error(`Max retries (${this.maxRetries}) exceeded for ${context}`) 
    }
  }
} 
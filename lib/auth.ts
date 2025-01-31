import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'edge'

export async function createClient() {
  const cookieStore = cookies()

  return createServerComponentClient(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  )
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
}

// Add type for session
type AuthSession = {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  access_token: string;
};

// Enhance requireAuth to include role-based access
export async function requireAuth(requiredRole?: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  if (requiredRole) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== requiredRole) {
      redirect('/unauthorized');
    }
  }

  return session;
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export const handlers = {
  GET: async (request: Request) => {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const { data: { session }, error } = await supabase.auth.getSession()
    return Response.json({ session, error })
  },
  POST: async (request: Request) => {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )
    const { data: { session }, error } = await supabase.auth.getSession()
    return Response.json({ session, error })
  }
}

// Add function to check specific permissions
export async function hasPermission(permission: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return false;

  const { data: userPermissions } = await supabase
    .from('user_permissions')
    .select('permission')
    .eq('user_id', session.user.id);

  return userPermissions?.some(p => p.permission === permission) ?? false;
}

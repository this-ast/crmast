import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, meta?: Record<string, string>) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return null
    return data as Profile
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  })

  // Initial session check on mount
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (cancelled) return
          setState({ user: session.user, profile, session, loading: false })
        } else {
          setState({ user: null, profile: null, session: null, loading: false })
        }
      } catch {
        if (!cancelled) {
          setState({ user: null, profile: null, session: null, loading: false })
        }
      }
    }

    init()

    // Failsafe timeout
    const timer = setTimeout(() => {
      if (!cancelled) {
        setState(prev => prev.loading ? { ...prev, loading: false } : prev)
      }
    }, 6000)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // Listen for auth changes (login, logout, token refresh)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({ user: session.user, profile, session, loading: false })
        } else {
          setState({ user: null, profile: null, session: null, loading: false })
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error as Error }

    // Immediately set user state without waiting for onAuthStateChange
    const profile = await fetchProfile(data.user.id)
    setState({ user: data.user, profile, session: data.session, loading: false })
    return { error: null }
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    meta?: Record<string, string>
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    })
    return { error: error as Error | null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ user: null, profile: null, session: null, loading: false })
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error as Error | null }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error as Error | null }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const profile = await fetchProfile(state.user.id)
    setState(prev => ({ ...prev, profile }))
  }, [state.user])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useUser() {
  const { user, profile } = useAuth()
  return { user, profile }
}

// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserRequest {
  email: string
  password: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }

  try {
    // Get Supabase URL from request headers or environment
    // @ts-ignore - Deno runtime
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 
                       req.headers.get('x-supabase-url') ||
                       (() => {
                         // Extract from request URL if available
                         const url = new URL(req.url)
                         const host = url.hostname
                         if (host.includes('supabase.co')) {
                           return `https://${host.split('.')[0]}.supabase.co`
                         }
                         return null
                       })()
    
    // @ts-ignore - Deno runtime
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
        url: supabaseUrl,
        keyLength: supabaseServiceKey?.length || 0
      })
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Edge Function secrets.',
          hint: 'Go to Supabase Dashboard → Edge Functions → Settings → Secrets and add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    const { email, password } = await req.json() as CreateUserRequest

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create user using admin API
    console.log('Attempting to create user:', {
      email: email.trim(),
      url: supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-confirm, skip email verification
      user_metadata: {}
    })

    if (error) {
      console.error('Error creating user:', {
        message: error.message,
        status: error.status,
        name: error.name,
        fullError: error
      })
      
      let errorMessage = error.message || 'Failed to create user'
      let statusCode = 400
      
      if (error.message?.includes('already registered') || 
          error.message?.includes('already exists') ||
          error.message?.includes('User already registered')) {
        errorMessage = 'Email address is already registered. Please use a different email or sign in instead.'
      } else if (error.message?.includes('password')) {
        errorMessage = 'Password does not meet requirements.'
      } else if (error.message?.includes('Database error') || error.message?.includes('database')) {
        errorMessage = 'Database error. This might be a Supabase configuration issue. Please check: 1) Project is active, 2) Database is running, 3) Try creating user via Supabase Dashboard → Authentication → Users → Add user'
        statusCode = 500
      } else if (error.status === 500 || error.message?.includes('500')) {
        errorMessage = 'Server error. Please check Supabase project status and try again.'
        statusCode = 500
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: error.message,
          status: error.status
        }),
        { 
          status: statusCode, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    if (!data || !data.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          email_confirmed: data.user.email_confirmed_at ? true : false
        },
        message: 'User created successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  } catch (error: any) {
    console.error('Exception creating user:', error)
    return new Response(
      JSON.stringify({
        error: error?.message || 'Internal server error',
        details: error?.stack
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})


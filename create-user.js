// Create User Script - Management API
// Run with: node create-user.js

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

// Get environment variables or use defaults
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vvrulvxeaejxhwnafwrq.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Function to prompt for input
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

// Function to create user
async function createUser(email, password) {
  if (!SERVICE_ROLE_KEY) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set!')
    console.log('\n📝 How to get Service Role Key:')
    console.log('1. Go to Supabase Dashboard → Settings → API')
    console.log('2. Find "service_role" key (NOT anon key)')
    console.log('3. Click eye icon to reveal it')
    console.log('4. Copy the full key')
    console.log('\n💡 Then run:')
    console.log('   SUPABASE_SERVICE_ROLE_KEY="your_key_here" node create-user.js')
    console.log('\n   Or create a .env file with:')
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_key_here')
    process.exit(1)
  }

  console.log('\n🔧 Creating Supabase admin client...')
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('📧 Creating user:', email)
  console.log('⏳ Please wait...\n')

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-confirm, skip email verification
      user_metadata: {
        created_via: 'management_api_script',
        created_at: new Date().toISOString()
      }
    })

    if (error) {
      console.error('❌ Error creating user:', error.message)
      
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        console.log('\n💡 User already exists! Try a different email or login with existing credentials.')
      } else if (error.message?.includes('password')) {
        console.log('\n💡 Password issue. Make sure password is at least 6 characters.')
      } else {
        console.log('\n💡 Full error:', error)
      }
      
      process.exit(1)
    }

    if (data && data.user) {
      console.log('✅ User created successfully!')
      console.log('\n📋 User Details:')
      console.log('   Email:', data.user.email)
      console.log('   ID:', data.user.id)
      console.log('   Email Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No')
      console.log('   Created At:', data.user.created_at)
      console.log('\n🎉 You can now login at: http://localhost:5184/login')
      console.log('   Email:', email)
      console.log('   Password:', password)
      console.log('\n')
    } else {
      console.error('❌ User creation failed - no user data returned')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Exception:', error.message)
    console.error('   Stack:', error.stack)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Main function
async function main() {
  console.log('🚀 Supabase User Creation Script')
  console.log('================================\n')

  // Check if email and password provided as arguments
  const email = process.argv[2]
  const password = process.argv[3]

  if (email && password) {
    // Use command line arguments
    await createUser(email, password)
  } else {
    // Interactive mode
    console.log('📝 Enter user details (or press Ctrl+C to cancel)\n')
    
    const emailInput = await question('Email: ')
    if (!emailInput || !emailInput.includes('@')) {
      console.error('❌ Invalid email address')
      rl.close()
      process.exit(1)
    }

    const passwordInput = await question('Password (min 6 chars): ')
    if (!passwordInput || passwordInput.length < 6) {
      console.error('❌ Password must be at least 6 characters')
      rl.close()
      process.exit(1)
    }

    await createUser(emailInput, passwordInput)
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  rl.close()
  process.exit(1)
})


# Authentication Setup Guide

## ✅ Features Implemented

### 1. **Login Flow**
- ✅ Email + Password form with client-side validation
- ✅ API call to Supabase Auth (`/auth/login`)
- ✅ JWT + Refresh Token + HttpOnly Cookie (handled by Supabase)
- ✅ Failed attempt tracking (3+ failures trigger CAPTCHA)
- ✅ CAPTCHA verification for security
- ✅ Redirect to Dashboard on success
- ✅ Session refresh mechanism
- ✅ Auto-logout on invalid refresh token

### 2. **Components Created**

#### `src/context/AuthContext.jsx`
- Manages authentication state
- Tracks failed login attempts
- Handles session refresh
- Auto-logout on session expiry

#### `src/pages/Login.jsx`
- Login form with email/password
- Client-side validation
- CAPTCHA after 3 failed attempts
- Error handling and display

#### `src/components/ProtectedRoute.jsx`
- Route guard component
- Redirects to login if not authenticated
- Shows loading state during auth check

#### `src/pages/Dashboard.jsx`
- User dashboard after login
- Session status display
- Quick actions
- Logout functionality

## 🔧 Setup Instructions

### Step 1: Enable Supabase Authentication

1. Go to Supabase Dashboard → Authentication
2. Enable **Email** provider
3. Configure email templates (optional)
4. Set up email confirmation (optional, can disable for testing)

### Step 2: Create Test User

1. Go to Supabase Dashboard → Authentication → Users
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. Click **"Create user"**

Or use the signup flow in the app (if you add a signup page).

### Step 3: Test the Login Flow

1. Start your dev server: `npm run dev`
2. Navigate to `/login`
3. Enter test user credentials
4. Should redirect to `/dashboard` on success

## 🔐 Security Features

### Failed Login Attempts
- Tracks attempts in localStorage
- Resets after 15 minutes
- Shows CAPTCHA after 3 failed attempts
- Simple math CAPTCHA (can be upgraded to reCAPTCHA)

### Session Management
- JWT tokens stored in HttpOnly cookies (Supabase handles this)
- Auto-refresh every hour
- Auto-logout on refresh failure
- Session persists across page refreshes

### Protected Routes
- All routes except `/login` are protected
- Unauthenticated users redirected to login
- Loading state during auth check

## 📋 Login Flow Steps

| Step | System Action |
|------|--------------|
| User opens login page | UI loads email + password form |
| User enters credentials | Client side validation triggers |
| Click Login → API call | Backend verifies credentials (Supabase Auth) |
| If success | Create JWT + Refresh Token + HttpOnly Cookie |
| If 3+ failures | Trigger CAPTCHA |
| Next → Redirect Dashboard | Load session + permissions |
| Session expires → Refresh token | Restore login silently |
| If refresh invalid | Logout + force re-login |

## 🎨 UI Features

- Modern, gradient design
- Form validation with error messages
- Loading states
- CAPTCHA with visual feedback
- Responsive layout
- Accessible form elements

## 🔄 Session Refresh

The app automatically refreshes the session:
- Every hour (configurable)
- On page load
- Before token expiry

If refresh fails:
- User is logged out
- Redirected to login page
- Failed attempts counter reset

## 🚀 Next Steps (Optional Enhancements)

1. **Signup Page**: Add user registration
2. **Password Reset**: Forgot password flow
3. **Email Verification**: Verify email on signup
4. **reCAPTCHA**: Replace simple CAPTCHA with Google reCAPTCHA
5. **OTP**: Add OTP verification for additional security
6. **Remember Me**: Option to extend session duration
7. **Two-Factor Auth**: Add 2FA support

## 🐛 Troubleshooting

### "User not found" error
- Check if user exists in Supabase Auth
- Verify email is correct
- Check Supabase Auth is enabled

### Session not persisting
- Check browser localStorage is enabled
- Verify Supabase client config has `persistSession: true`

### CAPTCHA not showing
- Check failed attempts in localStorage
- Clear localStorage and try 3 failed logins

### Redirect loop
- Check ProtectedRoute is working
- Verify AuthContext is properly initialized
- Check route configuration in App.jsx

## 📝 Environment Variables

No additional env variables needed - uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These are already configured for authentication.


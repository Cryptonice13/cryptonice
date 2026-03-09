

## Plan: Fix Forgot Password Flow

### Problems Identified
1. **No popup/dialog**: Clicking "Forgot Password?" toggles a flag that reuses the login form submit handler awkwardly -- no clear separate UI
2. **No `/reset-password` page**: The reset email redirects to `/reset-password` but that route doesn't exist in `App.tsx`, so users land on a blank page
3. **No password update form**: There's no page where users can actually set their new password after clicking the email link

### Changes

#### 1. Create Forgot Password Dialog (`src/pages/Login.tsx`)
- Replace the current `showForgotPassword` toggle with a proper `Dialog` component
- Dialog contains just an email input and "Send Reset Link" button
- Clean separation from the login form logic

#### 2. Create Reset Password Page (`src/pages/ResetPassword.tsx`)
- New page that handles the recovery token from the email link
- Listens for `PASSWORD_RECOVERY` event from `supabase.auth.onAuthStateChange`
- Shows a form with "New Password" and "Confirm Password" fields
- Calls `supabase.auth.updateUser({ password })` to set the new password
- Redirects to `/login` on success

#### 3. Add Route (`src/App.tsx`)
- Add `/reset-password` as a **public route** (not behind `ProtectedRoute`)

### Files
- **Modify**: `src/pages/Login.tsx` -- replace forgot password toggle with Dialog popup
- **Create**: `src/pages/ResetPassword.tsx` -- new password reset form page
- **Modify**: `src/App.tsx` -- add `/reset-password` route


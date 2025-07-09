# Firebase Authentication Setup Guide

This guide will help you set up Firebase authentication for your Scira MCP Chat application.

## Prerequisites

1. A Google account
2. Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "scira-mcp-chat")
4. Disable Google Analytics (not needed for this setup)
5. Click "Create project"

## Step 2: Set up Authentication

1. In your Firebase project dashboard, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Enable **Email/Password** authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to on
   - Click "Save"

## Step 3: Register Your Web App

1. In your Firebase project dashboard, click on the "Project settings" gear icon
2. Scroll down to "Your apps" section
3. Click on the "</>" (web) icon to add a web app
4. Enter an app nickname (e.g., "scira-mcp-chat-web")
5. **Do NOT** check "Also set up Firebase Hosting" (we're using Next.js)
6. Click "Register app"

## Step 4: Get Your Firebase Configuration

After registering your app, you'll see your Firebase configuration. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 5: Configure Environment Variables

1. Copy the `.env.local.example` file to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update your `.env.local` file with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Step 6: Configure Authorized Domains

1. In Firebase Console, go to Authentication > Settings
2. Scroll down to "Authorized domains"
3. Add `localhost` (should already be there by default)
4. When you deploy to production, add your production domain here

## Step 7: Test Your Setup

1. Make sure your `.env.local` file is configured correctly
2. Restart your development server:
   ```bash
   pnpm dev
   ```
3. Visit `http://localhost:3000`
4. You should see the authentication page
5. Try creating a new account with email and password
6. After successful authentication, you'll see the main application

## Authentication Flow

### How It Works

1. **Protected Routes**: The entire application is wrapped in a `ProtectedRoute` component
2. **Authentication Check**: If no user is logged in, the auth page is shown
3. **User Registration**: New users can create accounts with email/password
4. **User Login**: Existing users can sign in with their credentials
5. **Session Management**: Firebase handles session persistence across browser refreshes
6. **Logout**: Users can logout from the profile dropdown in the sidebar

### Features Included

- ✅ Email/Password authentication
- ✅ User registration with display name
- ✅ User session management
- ✅ Automatic user ID integration with chat system
- ✅ User profile display in sidebar
- ✅ Secure logout functionality
- ✅ Form validation and error handling
- ✅ Loading states and user feedback

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/api-key-not-valid)"**
   - Check that your `NEXT_PUBLIC_FIREBASE_API_KEY` is correct
   - Ensure there are no extra spaces or quotes

2. **"Firebase: Error (auth/domain-not-authorized)"**
   - Add `localhost` to your authorized domains in Firebase Console
   - Go to Authentication > Settings > Authorized domains

3. **Environment variables not loading**
   - Make sure your `.env.local` file is in the root directory
   - Restart your development server after making changes
   - Ensure all environment variables start with `NEXT_PUBLIC_`

4. **Authentication page not showing**
   - Check browser console for errors
   - Verify Firebase configuration is correct
   - Make sure the AuthProvider is wrapping your app

### Verification Steps

To verify everything is working correctly:

1. Open browser developer tools
2. Go to Application > Local Storage
3. You should see Firebase-related entries when logged in
4. Check the Network tab for Firebase API calls
5. Look for any errors in the Console tab

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Firebase configuration secure
- Use Firebase Security Rules when adding Firestore
- Regularly monitor authentication logs in Firebase Console

## Next Steps

Once authentication is working:

- Set up Firebase Firestore for additional user data
- Configure Firebase Security Rules
- Add email verification (optional)
- Add password reset functionality (optional)
- Set up user roles and permissions (optional)

Your Firebase authentication is now ready! Users must sign up or sign in before they can access the chat application.

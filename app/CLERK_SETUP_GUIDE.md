# 🔐 Clerk Authentication Setup Guide

## 🚨 **URGENT: Authentication Setup Required**

Your application is currently running with **temporary mock authentication**. To enable real user authentication and production security, you need to set up Clerk API keys.

## 📋 **Current Status**

- ❌ **Clerk Authentication**: Disabled (missing API keys)
- ✅ **Application**: Running with mock user data
- ✅ **Security Infrastructure**: Ready (waiting for Clerk keys)
- ✅ **All Features**: Working (with temporary authentication)

## 🎯 **Quick Setup (5 Minutes)**

### **Step 1: Create Clerk Account**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Sign up for a free account
3. Create a new application
4. Choose "Next.js" as your framework

### **Step 2: Get Your API Keys**

In your Clerk Dashboard:

1. Go to **API Keys** section
2. Copy the following keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_...`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_...`)

### **Step 3: Add Keys to Environment**

Add these to your `.env.local` file:

```bash
# Add these lines to your .env.local file
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"
CLERK_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"
```

### **Step 4: Enable Authentication**

After adding the keys, I'll help you uncomment the authentication code to enable Clerk.

## 🔧 **Detailed Setup Instructions**

### **1. Clerk Dashboard Configuration**

#### **A. Application Settings**
- **Application Name**: "Rise as One Basketball"
- **Application Type**: "Regular web application"
- **Framework**: "Next.js"
- **Authentication Methods**: Email + Password (recommended to start)

#### **B. User Management**
- **Sign-up**: Enable
- **Email verification**: Enable (recommended)
- **Password requirements**: Set according to your needs

#### **C. Social Providers (Optional)**
You can enable social login providers like:
- Google
- Microsoft
- Apple
- GitHub

### **2. Environment Variables Setup**

Your complete `.env.local` should look like this:

```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://confident-wildcat-124.convex.cloud
CONVEX_DEPLOYMENT=dev:confident-wildcat-124

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"
CLERK_SECRET_KEY="sk_test_YOUR_SECRET_KEY_HERE"

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL="RA1 Basketball <khouston@thebasketballfactoryinc.com>"
```

### **3. Code Changes to Enable Clerk**

Once you have the API keys, I'll help you:

1. **Uncomment ClerkProvider** in `components/providers.tsx`
2. **Enable Clerk middleware** in `middleware.ts`
3. **Update header component** to use real Clerk authentication
4. **Test authentication flow**

## 🎯 **After Setup - What You'll Get**

### **🔐 Real Authentication**
- Professional sign-in/sign-up pages
- Secure user sessions
- Password reset functionality
- Email verification

### **👤 User Management**
- Real user accounts in Clerk
- User profiles with metadata
- Role-based access control (admin vs user)
- User activity tracking

### **🛡️ Security Features**
- Protected routes and API endpoints
- Session management
- CSRF protection
- Rate limiting

## 🚀 **Next Steps After Clerk Setup**

### **1. Create Your Admin Account**
1. Sign up through your application
2. In Clerk Dashboard, find your user
3. Edit user and set `publicMetadata`:
   ```json
   {
     "role": "admin"
   }
   ```

### **2. Test Authentication**
- Sign out and sign back in
- Verify admin access to Settings page
- Test user registration flow
- Check protected routes work

### **3. Production Migration**
When ready for production:
- Get Clerk **production** keys (pk_live_... and sk_live_...)
- Update environment variables
- Test thoroughly in staging
- Deploy to production

## ⚠️ **Important Notes**

### **🔒 Security**
- **NEVER** commit API keys to git
- Use different keys for development and production
- Rotate keys regularly
- Monitor authentication logs

### **💡 Development Tips**
- Start with email/password authentication
- Add social providers later if needed
- Test authentication flow thoroughly
- Set up proper error handling

### **🎯 Production Considerations**
- Enable email verification
- Set up proper password policies
- Configure session timeouts
- Monitor failed login attempts

## 📞 **Need Help?**

### **Common Issues**
1. **"Publishable key not valid"** - Check your API keys are correct
2. **"Application not found"** - Verify you're using the right application's keys
3. **Sign-in not working** - Check your domain is configured in Clerk

### **Support Resources**
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Support](https://clerk.com/support)
- [Next.js + Clerk Guide](https://clerk.com/docs/quickstarts/nextjs)

## 🎉 **Ready to Enable Authentication?**

Once you have your Clerk API keys:

1. **Add them to `.env.local`**
2. **Let me know** and I'll uncomment the authentication code
3. **Test the authentication flow**
4. **Create your admin account**

Your application will then have **real, secure authentication** instead of the current mock system!

---

**Current Status: Waiting for Clerk API keys to enable real authentication 🔐** 
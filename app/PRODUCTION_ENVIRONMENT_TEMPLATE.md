# 🔒 Production Environment Configuration Template

## 🚨 **CRITICAL SECURITY NOTICE**
This template contains production security configurations. **NEVER** commit actual production keys to version control.

## 📋 **Production Environment Variables**

Create a `.env.production` file with these variables (replace with your actual production values):

```bash
# Rise as One Basketball Program Management System
# PRODUCTION Environment Configuration

# Application Environment
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Convex Production Configuration
NEXT_PUBLIC_CONVEX_URL="https://your-production-convex-url.convex.cloud"
CONVEX_DEPLOYMENT="prod:your-production-deployment-name"

# Authentication (Clerk) - PRODUCTION KEYS
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_YOUR_CLERK_PRODUCTION_PUBLISHABLE_KEY"
CLERK_SECRET_KEY="sk_live_YOUR_CLERK_PRODUCTION_SECRET_KEY"
CLERK_WEBHOOK_SECRET="whsec_YOUR_CLERK_PRODUCTION_WEBHOOK_SECRET"

# Payment Processing (Stripe) - PRODUCTION KEYS
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_STRIPE_PRODUCTION_PUBLISHABLE_KEY"
STRIPE_SECRET_KEY="sk_live_YOUR_STRIPE_PRODUCTION_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_STRIPE_PRODUCTION_WEBHOOK_SECRET"

# Email Service (Resend) - PRODUCTION
RESEND_API_KEY="re_YOUR_RESEND_PRODUCTION_API_KEY"
RESEND_FROM_EMAIL="RA1 Basketball <noreply@thebasketballfactoryinc.com>"

# AI Service (OpenAI) - PRODUCTION
OPENAI_API_KEY="sk-YOUR_OPENAI_PRODUCTION_API_KEY"

# SMS Service (Twilio) - PRODUCTION
TWILIO_ACCOUNT_SID="AC_YOUR_TWILIO_PRODUCTION_ACCOUNT_SID"
TWILIO_AUTH_TOKEN="YOUR_TWILIO_PRODUCTION_AUTH_TOKEN"
TWILIO_PHONE_NUMBER="+1YOUR_TWILIO_PRODUCTION_PHONE_NUMBER"

# File Storage (AWS S3) - PRODUCTION
AWS_ACCESS_KEY_ID="AKIA_YOUR_AWS_PRODUCTION_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_PRODUCTION_SECRET_ACCESS_KEY"
AWS_S3_BUCKET_NAME="your-production-s3-bucket-name"
AWS_S3_REGION="us-east-1"

# Error Tracking (Sentry) - PRODUCTION
SENTRY_DSN="https://YOUR_SENTRY_PRODUCTION_DSN@sentry.io/PROJECT_ID"

# Security Configuration
NEXTAUTH_SECRET="YOUR_SUPER_SECRET_NEXTAUTH_SECRET_32_CHARS_MIN"
ENCRYPTION_KEY="YOUR_32_CHARACTER_ENCRYPTION_KEY_HERE"

# Database Backup Configuration
BACKUP_ENCRYPTION_KEY="YOUR_BACKUP_ENCRYPTION_KEY_32_CHARS"
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM

# Rate Limiting Configuration
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes

# Session Configuration
SESSION_TIMEOUT="3600000"  # 1 hour in milliseconds
ADMIN_SESSION_TIMEOUT="7200000"  # 2 hours for admin users

# Security Headers
CONTENT_SECURITY_POLICY_ENABLED="true"
HSTS_MAX_AGE="31536000"  # 1 year
```

## 🔐 **How to Get Production Keys**

### **1. Clerk Authentication (Production)**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys** section
4. Copy **Production** keys (pk_live_... and sk_live_...)
5. Set up webhooks for production domain

### **2. Stripe Payment Processing (Production)**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to **Live mode** (top right)
3. Go to **Developers > API keys**
4. Copy **Publishable key** (pk_live_...) and **Secret key** (sk_live_...)
5. Set up webhooks for production domain

### **3. Resend Email Service (Production)**
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Verify your domain (thebasketballfactoryinc.com)
3. Create production API key
4. Set up DKIM/SPF records for email authentication

### **4. OpenAI API (Production)**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create production API key
3. Set up usage limits and monitoring

## 🛡️ **Security Checklist**

### **Environment Security**
- [ ] Never commit `.env.production` to version control
- [ ] Use different keys for development and production
- [ ] Rotate keys regularly (monthly for high-security)
- [ ] Monitor API usage and set up alerts

### **Domain Security**
- [ ] Set up SSL/TLS certificates (HTTPS only)
- [ ] Configure HSTS headers
- [ ] Set up Content Security Policy (CSP)
- [ ] Enable CORS for specific domains only

### **Authentication Security**
- [ ] Enable MFA for admin accounts
- [ ] Set up session timeouts
- [ ] Configure password policies
- [ ] Monitor failed login attempts

### **Payment Security**
- [ ] Enable Stripe fraud detection
- [ ] Set up webhook signature verification
- [ ] Monitor suspicious transactions
- [ ] Implement PCI compliance measures

## 🚀 **Deployment Security Steps**

### **1. Pre-Deployment**
```bash
# Install security packages
npm install helmet express-rate-limit
npm install @sentry/nextjs  # Error tracking

# Run security audit
npm audit --audit-level=moderate
npm audit fix
```

### **2. Environment Setup**
```bash
# Copy template and fill in production values
cp PRODUCTION_ENVIRONMENT_TEMPLATE.md .env.production

# Verify environment variables
node -e "console.log(process.env.NODE_ENV)"
```

### **3. Security Headers Setup**
```bash
# Update next.config.js with security headers
# Enable CSP, HSTS, and other security headers
```

## 🔧 **Production Configuration Files**

This guide will help you update:
- `middleware.ts` - Enable Clerk authentication
- `next.config.js` - Add security headers
- `lib/auth.ts` - Production auth configuration
- `lib/api-utils.ts` - Enhanced security validation

## 📊 **Monitoring & Alerts**

### **Set Up Monitoring For:**
- [ ] Failed authentication attempts
- [ ] Unusual payment patterns
- [ ] API rate limit violations
- [ ] Error rates and performance
- [ ] Database access patterns

### **Alert Thresholds:**
- Failed logins: > 5 attempts in 5 minutes
- Payment failures: > 10% failure rate
- API errors: > 5% error rate
- Response time: > 2 seconds average

## 🎯 **Next Steps**

1. **Review this template** and gather all production keys
2. **Create `.env.production`** with your actual values
3. **Update security configurations** using the guides below
4. **Test in staging environment** before production deployment
5. **Monitor and maintain** security measures ongoing

## ⚠️ **IMPORTANT REMINDERS**

- **NEVER** use development keys in production
- **ALWAYS** use HTTPS in production
- **REGULARLY** rotate API keys and secrets
- **MONITOR** all authentication and payment activities
- **BACKUP** your Convex database regularly
- **UPDATE** dependencies for security patches 
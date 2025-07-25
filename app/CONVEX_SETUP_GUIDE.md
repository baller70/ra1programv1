# Convex Setup Guide - Fix Notification Error

## 🚨 **Current Issue**
```
Error: Could not find public function for 'notifications:getNotifications'. 
Did you forget to run `npx convex dev` or `npx convex deploy`?
```

## ✅ **Solution Steps**

### **1. Navigate to Correct Directory**
```bash
cd "/Volumes/Softwaare Program/RA1 Yearly V2/ra1programv1/app"
```

### **2. Start Convex Development Server**
```bash
npx convex dev
```

**What this does:**
- Deploys the new `notifications` schema to Convex
- Makes all notification functions available
- Enables real-time updates for the notification system

### **3. Start Next.js Development Server** (in another terminal)
```bash
npm run dev
```

### **4. Verify Everything is Working**
Once both servers are running:

1. **Check Convex Console**: Look for "✓ Deployed" messages
2. **Visit the App**: Go to `http://localhost:3000`
3. **Test Notifications**: Click the notification bell icon in the header
4. **Test Settings**: Visit `/settings` to see the enhanced settings page

## 🔧 **What Was Added**

### **New Convex Schema** ✅
- **notifications table**: Complete notification management
- **Enhanced users table**: Added session and preference fields

### **New Convex Functions** ✅
- `notifications:getNotifications` - Fetch user notifications
- `notifications:getNotificationCounts` - Get notification counts
- `notifications:createNotification` - Create new notifications
- `notifications:markAsRead` - Mark notifications as read
- `notifications:generateSampleNotifications` - Create test data

### **New UI Components** ✅
- **NotificationDropdown**: Interactive notification bell
- **Enhanced Settings Page**: 6-tab comprehensive settings
- **Notifications Page**: Full notification management

## 🎯 **Expected Results**

### **Header Notification Icon** ✅
- Shows real unread notification count
- Click to see dropdown with notifications
- Mark as read, delete, and action buttons

### **Settings Page** ✅
- 6 organized tabs: General, Profile, Notifications, Appearance, Privacy, Advanced
- Complete user preference management
- Export/import and reset functionality

### **Notifications Page** ✅
- Full notification history and management
- Advanced filtering and search
- Bulk operations and sample data generation

## 🚨 **Troubleshooting**

### **If Convex Won't Start:**
```bash
# Check if you're in the right directory
pwd
# Should show: /Volumes/Softwaare Program/RA1 Yearly V2/ra1programv1/app

# Try clearing Convex cache
rm -rf .convex
npx convex dev
```

### **If Functions Still Not Found:**
1. **Wait for Deployment**: Convex needs time to deploy all functions
2. **Check Console**: Look for "✓ Deployed" messages in terminal
3. **Refresh Browser**: Hard refresh the page (Cmd+Shift+R)
4. **Check Network**: Ensure stable internet connection

### **If Settings Page Has Errors:**
1. **Check API Routes**: Ensure `/api/settings` is working
2. **Verify User Session**: User session system should be active
3. **Check Console**: Look for any JavaScript errors

## 🎉 **Success Indicators**

### **Convex is Working When You See:**
```
✓ Deployed notifications:getNotifications
✓ Deployed notifications:getNotificationCounts
✓ Deployed notifications:createNotification
✓ Deployed notifications:markAsRead
✓ Deployed users:getOrCreateUser
✓ Deployed users:updateUser
```

### **App is Working When You See:**
- ✅ Notification bell shows dynamic count (not static "3")
- ✅ Settings page loads with 6 tabs
- ✅ Notifications page accessible at `/notifications`
- ✅ No console errors in browser

## 📝 **Quick Test Steps**

### **Test Notifications:**
1. Visit `/notifications`
2. Click "Generate Samples" button
3. Check header notification icon for count update
4. Click notification bell to see dropdown

### **Test Settings:**
1. Visit `/settings`
2. Switch between tabs (General, Profile, etc.)
3. Change theme from System to Light/Dark
4. Save settings and verify persistence

## 🔄 **Commands Summary**

```bash
# Terminal 1: Start Convex
cd "/Volumes/Softwaare Program/RA1 Yearly V2/ra1programv1/app"
npx convex dev

# Terminal 2: Start Next.js
cd "/Volumes/Softwaare Program/RA1 Yearly V2/ra1programv1/app"
npm run dev

# Visit in browser
open http://localhost:3000
```

**Once both servers are running, the notification system and enhanced settings page will be fully functional!** 🚀 
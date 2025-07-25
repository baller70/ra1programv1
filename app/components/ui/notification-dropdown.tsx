'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Bell, Check, CheckCheck, Clock, AlertTriangle, DollarSign, FileText, Settings, X } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { ScrollArea } from './scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from './dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

interface NotificationDropdownProps {
  userId?: string
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Skip Convex queries if userId is not a valid Convex ID (development mode)
  const isValidConvexId = userId && userId.length > 10 && !userId.includes('-')
  
  // Fetch notifications and counts only if we have a valid Convex user ID
  const notifications = useQuery(
    api.notifications.getNotifications, 
    isValidConvexId ? {
      userId: userId as any,
      limit: 10,
      includeRead: false, // Only show unread by default
    } : "skip"
  )
  
  const notificationCounts = useQuery(
    api.notifications.getNotificationCounts,
    isValidConvexId ? {
      userId: userId as any,
    } : "skip"
  )
  
  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({ userId: userId as any })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId: notificationId as any })
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_overdue':
      case 'payment_reminder':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'contract_expiring':
        return <FileText className="h-4 w-4 text-orange-500" />
      case 'system_alert':
        return <Settings className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const unreadCount = notificationCounts?.unread || 0
  
  // Show development badge if not using valid Convex ID
  const showDevBadge = !isValidConvexId

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {showDevBadge ? (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              !
            </Badge>
          ) : (
            unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {!isValidConvexId ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Development Mode</p>
              <p className="text-xs text-muted-foreground px-4">
                Notifications will work once user authentication is properly configured
              </p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification: any) => (
                <div
                  key={notification._id}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer group"
                >
                  {/* Priority indicator */}
                  <div className={`w-1 h-12 rounded-full ${getPriorityColor(notification.priority)}`} />
                  
                  {/* Notification icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Notification content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {notification.parent && (
                            <Badge variant="outline" className="text-xs">
                              {notification.parent.name}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Action button */}
                        {notification.actionUrl && notification.actionText && (
                          <div className="mt-2">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                handleMarkAsRead(notification._id)
                                setIsOpen(false)
                              }}
                            >
                              <Link href={notification.actionUrl}>
                                {notification.actionText}
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </ScrollArea>
        
        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                asChild
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Link href="/notifications">
                  View All Notifications
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
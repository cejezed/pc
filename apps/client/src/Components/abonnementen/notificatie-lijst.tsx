// src/Components/abonnementen/notificatie-lijst.tsx
import React from "react";
import { Bell, X, AlertTriangle, Clock, CheckCircle, Info } from "lucide-react";
import type { Subscription } from "./types";
import { daysUntil, formatDate, EUR, formatBillingCycle } from "./helpers";

export interface Notification {
  id: string;
  type: 'cancellation_deadline' | 'billing_reminder' | 'expired' | 'renewal' | 'general';
  title: string;
  message: string;
  subscription?: Subscription;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  action_url?: string;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onDismiss,
  onClearAll,
}: {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const sortedNotifications = notifications.sort((a, b) => {
    // Unread first, then by priority, then by date
    if (a.read !== b.read) return a.read ? 1 : -1;
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Geen notificaties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">
            Notificaties
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>
        
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Alles wissen
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {sortedNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'cancellation_deadline':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'billing_reminder':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'expired':
        return <X className="w-5 h-5 text-red-500" />;
      case 'renewal':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500 bg-red-50/50';
      case 'high':
        return 'border-l-4 border-l-orange-500 bg-orange-50/50';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  return (
    <div
      className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50/30' : ''
      } ${getPriorityStyles()}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {/* Subscription info */}
              {notification.subscription && (
                <div className="mt-2 text-xs text-gray-500">
                  {notification.subscription.name} • {EUR(notification.subscription.cost_cents)} {formatBillingCycle(notification.subscription.billing_cycle)}
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(notification.created_at)}
              </div>
            </div>

            {/* Unread indicator & dismiss button */}
            <div className="flex items-center gap-2 ml-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Verwijderen"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to generate notifications from subscriptions
export function useNotifications(subscriptions: Subscription[]): Notification[] {
  return React.useMemo(() => {
    const notifications: Notification[] = [];
    const now = new Date();

    subscriptions.forEach((subscription) => {
      // Cancellation deadline warnings
      if (subscription.cancellation_deadline && subscription.status === 'active') {
        const days = daysUntil(subscription.cancellation_deadline);
        
        if (days >= 0 && days <= 7) {
          const priority = days <= 1 ? 'urgent' : days <= 3 ? 'high' : 'medium';
          
          notifications.push({
            id: `cancellation-${subscription.id}`,
            type: 'cancellation_deadline',
            title: days === 0 ? 'Laatste dag om op te zeggen!' : `Opzegtermijn ${subscription.name}`,
            message: days === 0 
              ? `Vandaag is de laatste dag om ${subscription.name} op te zeggen voor de volgende verlengdatum.`
              : `Je kunt ${subscription.name} nog ${days} dag${days !== 1 ? 'en' : ''} opzeggen voor de volgende verlengdatum.`,
            subscription,
            priority,
            read: false,
            created_at: now.toISOString(),
          });
        }
      }

      // Billing reminders (3 days before)
      if (subscription.next_billing_date && subscription.status === 'active') {
        const days = daysUntil(subscription.next_billing_date);
        
        if (days >= 0 && days <= 3) {
          notifications.push({
            id: `billing-${subscription.id}`,
            type: 'billing_reminder',
            title: `Betaling ${subscription.name}`,
            message: days === 0
              ? `${EUR(subscription.cost_cents)} wordt vandaag afgeschreven voor ${subscription.name}.`
              : `Over ${days} dag${days !== 1 ? 'en' : ''} wordt ${EUR(subscription.cost_cents)} afgeschreven voor ${subscription.name}.`,
            subscription,
            priority: days === 0 ? 'high' : 'medium',
            read: false,
            created_at: now.toISOString(),
          });
        }
      }

      // Expired subscriptions
      if (subscription.status === 'expired') {
        notifications.push({
          id: `expired-${subscription.id}`,
          type: 'expired',
          title: `${subscription.name} verlopen`,
          message: `Je abonnement op ${subscription.name} is verlopen. Vernieuw of verwijder het abonnement.`,
          subscription,
          priority: 'medium',
          read: false,
          created_at: now.toISOString(),
        });
      }
    });

    return notifications;
  }, [subscriptions]);
}

// Compact notification badge for header
export function NotificationBadge({ 
  notifications, 
  onClick 
}: { 
  notifications: Notification[]; 
  onClick: () => void; 
}) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUrgent = notifications.some(n => !n.read && n.priority === 'urgent');

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      title="Notificaties"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span
          className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white rounded-full ${
            hasUrgent ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
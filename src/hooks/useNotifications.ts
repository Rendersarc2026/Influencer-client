import { useContext } from 'react';
import { NotificationContext } from '../context/notification-context-def';
import { NotificationContextType } from '@types';

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

import React, { useEffect } from 'react';
import { AppNotification } from '../types';
import { CheckCircleIcon, InformationCircleIcon, XCircleIcon, EnvelopeIcon } from './icons';

interface NotificationsProps {
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
}

const NOTIFICATION_ICONS = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-400" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-400" />,
  error: <XCircleIcon className="w-6 h-6 text-red-400" />,
};

const NOTIFICATION_COLORS = {
  success: 'border-green-500/50',
  info: 'border-blue-500/50',
  error: 'border-red-500/50',
};

const Notification: React.FC<{ notification: AppNotification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000); // Notifications disappear after 6 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isEmail = notification.message.toLowerCase().includes('email');
  const icon = isEmail ? <EnvelopeIcon className="w-6 h-6 text-yellow-400" /> : NOTIFICATION_ICONS[notification.type];
  const borderColor = isEmail ? 'border-yellow-500/50' : NOTIFICATION_COLORS[notification.type];

  return (
    <div 
        className={`w-full max-w-sm bg-brand-primary/80 backdrop-blur-md shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${borderColor} transition-all duration-300 animate-fade-in-right`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{icon}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-white">{notification.message}</p>
            {notification.details && <p className="mt-1 text-sm text-slate-300 whitespace-pre-wrap">{notification.details}</p>}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button onClick={onDismiss} className="inline-flex text-slate-400 hover:text-white">
              <span className="sr-only">Close</span>
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notifications: React.FC<NotificationsProps> = ({ notifications, setNotifications }) => {
  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {notifications.map(notification => (
          <Notification 
            key={notification.id} 
            notification={notification} 
            onDismiss={() => handleDismiss(notification.id)} 
          />
        ))}
        <style>{`
            @keyframes fade-in-right {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            .animate-fade-in-right {
                animation: fade-in-right 0.5s ease-out forwards;
            }
        `}</style>
      </div>
    </div>
  );
};

export default Notifications;

import React, { useState, useEffect } from 'react';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import { Bell, X, Clock, CheckCircle } from 'lucide-react';

const LiveOrderNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const { isConnected } = useOrderSocket({
    onNewOrder: (data) => {
      const notification = {
        id: Date.now(),
        type: 'new-order',
        title: 'New Order Received',
        message: `Table ${data.tableNo} - ${data.itemCount} items`,
        timestamp: new Date(),
        data
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setIsVisible(true);
    },
    onNewKOT: (data) => {
      const notification = {
        id: Date.now(),
        type: 'new-kot',
        title: 'New KOT Generated',
        message: `KOT #${data.kot.displayNumber} for Table ${data.tableNo}`,
        timestamp: new Date(),
        data
      };
      setNotifications(prev => [notification, ...prev.slice(0, 4)]);
      setIsVisible(true);
    },
    onKOTStatusUpdate: (data) => {
      const statusMessages = {
        preparing: 'being prepared',
        ready: 'ready for serving',
        served: 'served'
      };
      const message = statusMessages[data.status];
      if (message) {
        const notification = {
          id: Date.now(),
          type: 'kot-status',
          title: 'KOT Status Update',
          message: `KOT #${data.kot?.displayNumber} is ${message}`,
          timestamp: new Date(),
          data
        };
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
        setIsVisible(true);
      }
    },
    showNotifications: false // We handle notifications manually
  });

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    setIsVisible(false);
  };

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, -1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!isConnected || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out animate-bounce"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                notification.type === 'new-order' ? 'bg-blue-100 text-blue-600' :
                notification.type === 'new-kot' ? 'bg-orange-100 text-orange-600' :
                'bg-green-100 text-green-600'
              }`}>
                {notification.type === 'new-order' ? <Bell className="w-4 h-4" /> :
                 notification.type === 'new-kot' ? <Clock className="w-4 h-4" /> :
                 <CheckCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-500">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      
      {notifications.length > 1 && (
        <div className="text-center">
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveOrderNotifications;
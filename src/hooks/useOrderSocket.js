import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export const useOrderSocket = (onOrderUpdate) => {
  const { socket, isConnected } = useSocket();

  const handleNewOrder = useCallback((order) => {
    if (onOrderUpdate) {
      onOrderUpdate(order);
    }
  }, [onOrderUpdate]);

  const handleOrderStatusUpdate = useCallback((data) => {
    if (onOrderUpdate) {
      onOrderUpdate(data);
    }
  }, [onOrderUpdate]);

  useEffect(() => {
    if (!socket) return;

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdate', handleOrderStatusUpdate);
    socket.on('orderUpdate', handleOrderStatusUpdate);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdate', handleOrderStatusUpdate);
      socket.off('orderUpdate', handleOrderStatusUpdate);
    };
  }, [socket, handleNewOrder, handleOrderStatusUpdate]);

  return { isConnected };
};

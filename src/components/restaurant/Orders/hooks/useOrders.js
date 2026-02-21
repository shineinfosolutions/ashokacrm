import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/restaurant-orders/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const ordersData = Array.isArray(response.data) ? response.data : response.data.orders || [];
      const enrichedOrders = ordersData
        .filter(order => order.status !== 'PAID' && order.status !== 'CANCELLED');
      
      setOrders(enrichedOrders);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Sending order data:', JSON.stringify(orderData, null, 2));
      const response = await axios.post(`${API_BASE_URL}/api/restaurant-orders/create`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add new order to the list immediately
      setOrders(prev => [response.data, ...prev]);
      setActiveTab('list');
      return { success: true };
    } catch (err) {
      console.error('Create order error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      return { success: false, error: err.response?.data?.error || err.response?.data?.message || 'Failed to create order' };
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}/api/restaurant-orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOrders(prev => prev.filter(order => order && order._id).map(order => 
        order._id === orderId ? response.data.order || response.data : order
      ));
      
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.order || response.data);
      }
    } catch (err) {
      console.error('Update status error:', err);
      setError('Failed to update order status');
    }
  };

  const handleUpdatePriority = async (orderId, priority) => {
    try {
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, priority } : order
      ));

      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/restaurant-orders/${orderId}/priority`,
        { priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Update priority error:', err);
      setError('Failed to update order priority');
      fetchOrders();
    }
  };

  const handleProcessPayment = async (orderId, paymentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/restaurant-orders/${orderId}/payment`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove paid order from list immediately
      setOrders(prev => prev.filter(order => order._id !== orderId));
      
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(null);
      }
      
      setShowPaymentModal(false);
      return { success: true };
    } catch (err) {
      console.error('Process payment error:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to process payment' };
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setActiveTab('details');
  };

  const handlePaymentClick = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleTransferClick = (order) => {
    setSelectedOrder(order);
    setShowTransferModal(true);
  };

  const handleTransferSuccess = () => {
    fetchOrders();
  };

  return {
    orders,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedOrder,
    setSelectedOrder,
    showPaymentModal,
    setShowPaymentModal,
    showTransferModal,
    setShowTransferModal,
    fetchOrders,
    handleCreateOrder,
    handleUpdateStatus,
    handleUpdatePriority,
    handleProcessPayment,
    handleViewOrder,
    handlePaymentClick,
    handleTransferClick,
    handleTransferSuccess
  };
};

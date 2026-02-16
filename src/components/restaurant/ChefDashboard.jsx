import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import CountdownTimer from "./CountdownTimer";
import { Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

const ChefDashboard = () => {
  const { axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [allHistoryOrders, setAllHistoryOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [itemStates, setItemStates] = useState({});
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDate, setSelectedDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isConnected] = useState(false); // Placeholder for socket connection

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const menuResponse = await axios.get('/api/menu-items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const menuItems = menuResponse.data.menuItems || menuResponse.data.data || [];
      
      const newItemStates = {};
      
      const enhancedOrders = response.data.map(order => {
        const enhancedItems = order.items?.map((item, index) => {
          const menuItem = menuItems.find(mi => 
            mi._id === item.itemId || 
            mi.name === item.itemName || 
            mi.name === item.name
          );
          
          const price = item.price || menuItem?.Price || menuItem?.price || 0;
          const prepTime = menuItem?.timeToPrepare || 0;
          
          const key = `${order._id}-${index}`;
          newItemStates[key] = {
            status: item.status || 'pending',
            checked: false
          };
          
          return {
            name: item.itemName || item.name || menuItem?.name || 'Unknown Item',
            quantity: item.quantity || 1,
            price: price,
            prepTime: prepTime,
            status: item.status || 'pending'
          };
        }) || [];
        
        return {
          ...order,
          items: enhancedItems
        };
      });
      
      const activeOrders = enhancedOrders.filter(order => 
        order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
      );
      const allHistory = enhancedOrders.filter(order => 
        order.status === 'served' || order.status === 'completed' || order.status === 'cancelled'
      );
      
      setOrders(activeOrders);
      setAllHistoryOrders(allHistory);
      setItemStates(newItemStates);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setHistoryOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    if (selectedDate && selectedDate.trim() !== '') {
      const filterDateObj = new Date(selectedDate);
      const filtered = allHistoryOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === filterDateObj.toDateString();
      });
      setHistoryOrders(filtered);
    } else {
      setHistoryOrders(allHistoryOrders);
    }
  }, [selectedDate, allHistoryOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/restaurant-orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gray-50 min-h-screen"
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Chef Dashboard</h1>
            <p className="text-gray-600">Manage kitchen orders</p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {isConnected ? 'Live Updates Active' : 'Offline Mode'}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'active'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Active Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              History ({historyOrders.length})
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(activeTab === 'active' ? orders : historyOrders).map((order, index) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm text-gray-500">Order# {order._id.slice(-4)}</div>
                <div className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2">
                {order.tableNo || 'T'}
              </div>
              <div>
                <div className="text-xs text-gray-500">Table</div>
                <div className="text-sm font-medium">{order.tableNo || 'N/A'}</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium mb-2">{order.items?.length || 0} Items</div>
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">₹{order.amount || 0}</span>
              </div>
            </div>

            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <button
                onClick={() => updateOrderStatus(order._id, 'completed')}
                className="w-full bg-green-500 text-white py-2 rounded font-medium hover:bg-green-600"
              >
                Mark Complete
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {(activeTab === 'active' ? orders : historyOrders).length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-400 text-lg mb-2">🍳</div>
          <div className="text-gray-500">
            {activeTab === 'active' ? 'No active orders' : 'No order history'}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChefDashboard;

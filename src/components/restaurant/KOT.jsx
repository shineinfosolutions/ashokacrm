import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Pagination from '../common/Pagination';
import { useSocket } from '../../context/SocketContext';
import soundManager from '../../utils/sound';
import SoundToggle from '../common/SoundToggle';
import { Printer } from 'lucide-react';
import { motion } from 'framer-motion';

const KOT = () => {
  const { axios } = useAppContext();
  const [activeTab, setActiveTab] = useState('kots');
  const [kots, setKots] = useState([]);
  const [kotHistory, setKotHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [tables, setTables] = useState([]);
  const [kotForm, setKotForm] = useState({
    orderId: '',
    tableNo: '',
    items: [],
    priority: 'normal',
    estimatedTime: '',
    assignedChef: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredKots, setFilteredKots] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [lastKotCount, setLastKotCount] = useState(0);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [staffNotification, setStaffNotification] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userRestaurantRole, setUserRestaurantRole] = useState(null);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  const { socket } = useSocket();

  useEffect(() => {
    fetchUserRole();
    fetchMenuItems();
    fetchKOTs();
    fetchOrders();
    fetchChefs();
    fetchTables();
    
    // 🔥 WebSocket listeners (fallback to polling if no socket)
    if (socket) {
      // Join the waiters room to receive notifications
      socket.emit('join-waiter-dashboard');
      
      socket.on('new-order', (data) => {
        console.log('New order received in KOT:', data);
        
        // Play buzzer sound for new KOT
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: data.tableNo,
          itemCount: data.itemCount,
          orderId: data.order._id,
          items: data.kot.items || []
        });
        fetchKOTs();
        fetchOrders();
        setTimeout(() => setNewOrderNotification(null), 10000);
      });
    } else {
      // Fallback: Polling disabled - only use WebSocket
      console.log('WebSocket not available, polling disabled');
    }
    
    if (socket) {

      socket.on('new-kot', (data) => {
        // Play buzzer sound for new KOT
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: data.tableNo,
          itemCount: data.itemCount,
          orderId: data.kot.orderId,
          items: data.kot.items || []
        });
        fetchKOTs();
        setTimeout(() => setNewOrderNotification(null), 10000);
      });

      socket.on('kot-status-updated', () => {
        fetchKOTs();
        fetchOrders();
      });

      socket.on('order-status-updated', () => {
        fetchOrders();
      });
    }

    return () => {
      if (socket) {
        socket.off('new-order');
        socket.off('new-kot');
        socket.off('kot-status-updated');
        socket.off('order-status-updated');
      }
    };
  }, [socket, orderTypeFilter]);
  
  // Re-fetch KOTs when menu items are loaded
  useEffect(() => {
    if (menuItems.length > 0) {
      fetchKOTs();
    }
  }, [menuItems]);

  const checkForNewOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const orders = response.data || [];
      const currentOrderCount = orders.length;
      
      console.log('Checking orders - Current:', currentOrderCount, 'Last:', lastOrderCount);
      
      if (lastOrderCount > 0 && currentOrderCount > lastOrderCount) {
        // New order detected - get the most recent order
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const newOrder = sortedOrders[0];
        
        console.log('New order detected:', newOrder);
        
        // Play buzzer sound for new KOT
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: newOrder.tableNo,
          itemCount: newOrder.items?.length || 0,
          orderId: newOrder._id,
          items: newOrder.items || []
        });
        setTimeout(() => setNewOrderNotification(null), 10000);
      }
      
      // Initialize lastOrderCount on first load
      if (lastOrderCount === 0) {
        setLastOrderCount(currentOrderCount);
      } else {
        setLastOrderCount(currentOrderCount);
      }
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  };

  const fetchKOTs = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching consolidated orders...');
      
      // Fetch both restaurant and in-room orders
      const [restaurantRes, inRoomRes] = await Promise.all([
        axios.get('/api/restaurant-orders/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/inroom-orders/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      // Combine and mark order types
      const restaurantOrders = (restaurantRes.data || []).map(o => ({ ...o, orderType: 'restaurant' }));
      const inRoomOrders = (inRoomRes.data || []).map(o => ({ ...o, orderType: 'inroom' }));
      const allOrders = [...restaurantOrders, ...inRoomOrders].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      console.log('Orders API Response:', allOrders);
      
      // Transform orders to show consolidated KOT view
      const consolidatedOrders = allOrders.map(order => {
        const allItems = (order.allKotItems || order.items || []).map(item => {
          // Handle different item data structures
          if (typeof item === 'string') {
            return { name: item, quantity: 1, kotNumber: 1 };
          }
          
          if (typeof item === 'object') {
            // Try to find menu item by ID
            let itemName = item.name || item.itemName;
            
            if (item.itemId && menuItems.length > 0) {
              const menuItem = menuItems.find(mi => mi._id === item.itemId || mi.id === item.itemId);
              if (menuItem) {
                itemName = menuItem.name || menuItem.itemName;
              }
            }
            
            // If still no name, try to match by other properties
            if (!itemName && menuItems.length > 0) {
              const menuItem = menuItems.find(mi => 
                mi.name === item.name || 
                mi.itemName === item.itemName ||
                mi._id === item.id
              );
              if (menuItem) {
                itemName = menuItem.name || menuItem.itemName;
              }
            }
            
            return {
              ...item,
              name: itemName || 'Unknown Item',
              kotNumber: item.kotNumber || 1
            };
          }
          
          return item;
        });
        
        return {
          _id: order._id,
          orderId: order._id,
          tableNo: order.tableNo,
          status: order.status || 'pending',
          orderStatus: order.status || 'pending',
          items: allItems,
          kotCount: order.kotCount || 1,
          priority: order.priority || 'normal',
          assignedChef: order.assignedChef,
          createdAt: order.createdAt
        };
      });
      
      // Separate active orders from history
      const activeOrders = consolidatedOrders.filter(order => {
        const isServed = order.status === 'served';
        const isPaid = order.status === 'paid';
        const isCompleted = order.status === 'completed';
        const isCancelled = order.status === 'cancelled';
        
        // Active if not in final states
        return !isServed && !isPaid && !isCompleted && !isCancelled;
      });
      
      const historyOrders = consolidatedOrders.filter(order => {
        const isServed = order.status === 'served';
        const isPaid = order.status === 'paid';
        const isCompleted = order.status === 'completed';
        const isCancelled = order.status === 'cancelled';
        
        // History if in final states
        return isServed || isPaid || isCompleted || isCancelled;
      });
      
      // Apply order type filter
      const filteredActive = orderTypeFilter === 'all' ? activeOrders : activeOrders.filter(o => o.orderType === orderTypeFilter);
      const filteredHistory = orderTypeFilter === 'all' ? historyOrders : historyOrders.filter(o => o.orderType === orderTypeFilter);
      
      // Check for new orders
      if (kots.length > 0 && activeOrders.length > kots.length) {
        const newOrder = activeOrders[activeOrders.length - 1];
        
        // Play buzzer sound for new KOT
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: newOrder.tableNo,
          itemCount: newOrder.items?.length || 0,
          orderId: newOrder.orderId,
          items: newOrder.items || []
        });
        
        setTimeout(() => {
          setNewOrderNotification(null);
        }, 10000);
      }
      
      console.log('Consolidated Orders:', consolidatedOrders.length);
      console.log('Active Orders:', activeOrders.length);
      console.log('History Orders:', historyOrders.length);
      
      setKots(filteredActive);
      setKotHistory(filteredHistory);
      setFilteredKots(activeTab === 'history' ? filteredHistory : filteredActive);
    } catch (error) {
      console.error('Error fetching consolidated orders:', error);
    }
  };
  
  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/items/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const itemsData = Array.isArray(response.data) ? response.data : (response.data.items || []);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };
  


  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchChefs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/search/field?model=users&field=role&value=restaurant', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const chefData = Array.isArray(response.data) ? response.data : (response.data.users || response.data.data || []);
      setChefs(chefData.filter(user => user.restaurantRole === 'chef'));
    } catch (error) {
      console.error('Error fetching chefs:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tableData = Array.isArray(response.data) ? response.data : (response.data.tables || response.data.data || []);
      setTables(tableData);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  };

  const fetchUserRole = async () => {
    try {
      // Get roles directly from localStorage
      const role = localStorage.getItem('role');
      const restaurantRole = localStorage.getItem('restaurantRole');
      
      console.log('=== KOT ACCESS DEBUG ===');
      console.log('Role from localStorage:', role);
      console.log('Restaurant Role from localStorage:', restaurantRole);
      console.log('=======================');
      
      setUserRole(role);
      setUserRestaurantRole(restaurantRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const markServed = async (kotId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/kot/${kotId}/served`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Notify staff about served item
      setStaffNotification({
        title: 'Order Served',
        message: `KOT ${kotId} has been marked as served by chef`,
        type: 'success'
      });
      
      setTimeout(() => {
        setStaffNotification(null);
      }, 5000);
      
      fetchKOTs();
    } catch (error) {
      console.error('Error marking KOT as served:', error);
    }
  };

  const canMarkAsServed = () => {
    // Allow restaurant roles (chef, manager) and staff with kitchen department
    if (userRole === 'restaurant' && (userRestaurantRole === 'chef' || userRestaurantRole === 'manager')) {
      return true;
    }
    
    // Allow staff with kitchen department
    if (userRole === 'staff') {
      try {
        const departmentData = localStorage.getItem('department') || localStorage.getItem('departments');
        const userDepartments = departmentData && departmentData !== 'undefined' ? JSON.parse(departmentData) : [];
        return userDepartments.some(dept => dept && dept.name === 'kitchen');
      } catch (e) {
        return false;
      }
    }
    
    return false;
  };

  const createKOT = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/kot/create', kotForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Send notification to assigned chef
      if (kotForm.assignedChef) {
        try {
          await axios.post('/api/notifications/create', {
            title: 'New KOT Assigned',
            message: `New KOT for Table ${kotForm.tableNo} - ${kotForm.items?.length || 0} items (Priority: ${kotForm.priority})`,
            type: 'kitchen',
            priority: kotForm.priority,
            department: 'kitchen',
            userId: kotForm.assignedChef
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (notifError) {
          console.error('Notification failed:', notifError);
        }
      }
      
      alert('KOT created successfully!');
      setKotForm({
        orderId: '',
        tableNo: '',
        items: [],
        priority: 'normal',
        estimatedTime: '',
        assignedChef: ''
      });
      fetchKOTs();
    } catch (error) {
      console.error('Error creating KOT:', error);
      alert('Failed to create KOT');
    }
  };

  const updateKOTStatus = async (kotId, newStatus, orderId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Update KOT status
      await axios.patch(`/api/kot/${kotId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update corresponding order status
      const orderStatus = getOrderStatusFromKOT(newStatus);
      if (orderStatus && orderId) {
        await axios.patch(`/api/restaurant-orders/${orderId}/status`, {
          status: orderStatus
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Show notification
        alert(`Order status updated to ${orderStatus}`);
      }
      
      fetchKOTs();
      fetchOrders();
    } catch (error) {
      console.error('Error updating KOT status:', error);
      alert('Failed to update status');
    }
  };
  
  const getOrderStatusFromKOT = (kotStatus) => {
    switch (kotStatus) {
      case 'pending': return 'pending';
      case 'preparing': return 'preparing';
      case 'ready': return 'ready';
      case 'served': return 'served';
      default: return null;
    }
  };

  const printKOT = (kot) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>KOT #${kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: monospace;
                    width: 80mm;
                    font-size: 10px;
                }
                .print-content {
                    width: 80mm;
                    max-width: 80mm;
                    margin: 0;
                    padding: 2mm;
                    font-size: 10px;
                    line-height: 1.2;
                    box-sizing: border-box;
                }
                .print-header {
                    font-size: 12px;
                    font-weight: bold;
                }
                .text-center { text-align: center; }
                .mb-1 { margin-bottom: 4px; }
                .mb-2 { margin-bottom: 8px; }
                .mb-3 { margin-bottom: 12px; }
                .border-b { border-bottom: 1px solid #000; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .font-bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="print-content">
                <div class="text-center mb-3">
                    <div class="print-header mb-2">ASHOKA</div>
                    <div class="mb-1">EXPERIENCE COMFORT</div>
                    <div class="mb-2">KITCHEN ORDER TICKET</div>
                    <div class="font-bold mb-1">ASHOKA DINING</div>
                    <div class="mb-1">(A Unit Of Ashoka hospitality)</div>
                    <div class="mb-1">Add : Near Hanuman Mandir, Deoria Road</div>
                    <div class="mb-1">Kurnaghat, Gorakhpur - 273008</div>
                    <div class="mb-1">GSTIN : 09ANHPJ7242D2Z1</div>
                    <div class="mb-2">Mob : 6388491244</div>
                    <div class="border-b mb-2"></div>
                </div>

                <div class="mb-3">
                    <div class="flex justify-between mb-1">
                        <span>KOT #: ${kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</span>
                        <span>Table: ${kot.tableNo || 'N/A'}</span>
                    </div>
                    <div class="flex justify-between mb-1">
                        <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
                        <span>Time: ${new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span>Status: ${kot.status?.toUpperCase() || 'PENDING'}</span>
                        <span>Priority: ${kot.priority?.toUpperCase() || 'NORMAL'}</span>
                    </div>
                    <div class="border-b mb-2"></div>
                </div>

                <div class="mb-2">
                    <div class="flex justify-between font-bold border-b mb-1">
                        <span style="width: 30%">Item</span>
                        <span style="width: 10%; text-align: center">Qty</span>
                        <span style="width: 15%; text-align: right">Price</span>
                        <span style="width: 15%; text-align: center">KOT</span>
                        <span style="width: 30%">Notes</span>
                    </div>
                </div>

                <div class="mb-3">
                    ${kot.items?.map(item => {
                        const itemName = typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item');
                        const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                        const price = typeof item === 'object' ? (item.price || 0) : 0;
                        const isFree = typeof item === 'object' ? (item.isFree || false) : false;
                        const kotNumber = typeof item === 'object' ? (item.kotNumber || 1) : 1;
                        const note = typeof item === 'object' ? (item.note || '') : '';
                        return `
                            <div class="flex justify-between mb-1">
                                <span style="width: 30%">${itemName}</span>
                                <span style="width: 10%; text-align: center">${quantity}</span>
                                <span style="width: 15%; text-align: right">${isFree ? 'FREE' : '₹' + price}</span>
                                <span style="width: 15%; text-align: center">K${kotNumber}</span>
                                <span style="width: 30%">${note || '-'}</span>
                            </div>
                        `;
                    }).join('') || '<div>No items</div>'}
                    <div class="border-b mb-2"></div>
                </div>

                <div class="mb-3">
                    <div class="mb-1">Chef: ${kot.assignedChef?.name || 'Unassigned'}</div>
                    <div class="mb-1">Total Items: ${kot.items?.length || 0}</div>
                    <div class="border-b mb-2"></div>
                </div>

                <div class="text-center mb-3">
                    <div class="mb-2">Kitchen Copy</div>
                    <div class="border-b mb-2"></div>
                    <div>Printed: ${new Date().toLocaleString('en-GB')}</div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const sourceKots = activeTab === 'history' ? kotHistory : kots;
    if (searchQuery.trim()) {
      const filtered = sourceKots.filter(kot => 
        kot.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kot._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kot.tableNo?.toString().includes(searchQuery)
      );
      setFilteredKots(filtered);
    } else {
      setFilteredKots(sourceKots);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-background min-h-screen"
    >
      {/* New Order Notification - Hidden for now */}
      {false && newOrderNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg animate-bounce max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-bold flex items-center">
                🔔 New Order!
              </h4>
              <p className="text-sm mt-1">
                Table {newOrderNotification.tableNo} - {newOrderNotification.itemCount} items
              </p>
              <p className="text-xs opacity-90 mb-2">
                Order: {newOrderNotification.orderId?.slice(-6)}
              </p>
              <div className="text-xs opacity-90">
                <strong>Items:</strong>
                <div className="max-h-16 overflow-y-auto">
                  {newOrderNotification.items?.map((item, index) => (
                    <div key={index} className="truncate">
                      • {item.name || item.itemName || 'Unknown'} x{item.quantity} {item.note && `(${item.note})`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setNewOrderNotification(null)}
              className="ml-3 text-white hover:text-gray-200 text-lg flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Staff Notification - Hidden for now */}
      {false && staffNotification && (
        <div className="fixed top-20 right-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg animate-pulse max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-bold flex items-center">
                👨‍🍳 {staffNotification.title}
              </h4>
              <p className="text-sm mt-1">
                {staffNotification.message}
              </p>
            </div>
            <button 
              onClick={() => setStaffNotification(null)}
              className="ml-3 text-white hover:text-gray-200 text-lg flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text">Kitchen Order Tickets (KOT)</h1>
          <SoundToggle />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab('kots');
                  setFilteredKots(kots);
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'kots'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                Active KOTs
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setFilteredKots(kotHistory);
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                KOT History
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                Create KOT
              </button>
            </nav>
          </div>
          
          <div className="p-0">
            {(activeTab === 'kots' || activeTab === 'history') && (
              <div className="p-6">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Order ID, KOT ID, or Table..."
                      className="flex-1 p-2 border border-border rounded bg-white text-text focus:border-primary focus:outline-none text-sm"
                      style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                    />
                    <select
                      value={orderTypeFilter}
                      onChange={(e) => setOrderTypeFilter(e.target.value)}
                      className="p-2 border border-border rounded bg-white text-text focus:border-primary focus:outline-none text-sm"
                      style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                    >
                      <option value="all">All Orders</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="inroom">In-Room</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-primary text-text px-4 py-2 rounded hover:bg-hover transition-colors whitespace-nowrap text-sm"
                      style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
                    >
                      Search
                    </button>
                  </div>
                </form>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead style={{ backgroundColor: 'hsl(45, 71%, 69%)' }}>
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Order ID</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>KOTs</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Table/Room</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Items</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Priority</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Status</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Chef</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((kot, index) => (
                        <tr key={kot._id} className={index % 2 === 0 ? 'bg-background' : 'bg-white'}>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-mono" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <div className="font-semibold">{kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</div>
                            <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                              kot.orderType === 'inroom' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {kot.orderType === 'inroom' ? '🏨 In-Room' : '🍽️ Restaurant'}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {kot.kotCount || 1} KOT{(kot.kotCount || 1) > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>{kot.tableNo}</td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <div className="max-w-xs">
                              {kot.items && kot.items.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-blue-600 font-medium mb-1">
                                    {kot.kotCount || 1} KOT{(kot.kotCount || 1) > 1 ? 's' : ''} • {kot.items.length} items
                                  </div>
                                  {kot.items.slice(0, 3).map((item, idx) => {
                                    const itemName = typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item');
                                    const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                                    const kotNumber = typeof item === 'object' ? (item.kotNumber || 1) : 1;
                                    const note = typeof item === 'object' ? item.note : null;
                                    
                                    return (
                                      <div key={idx} className="truncate flex items-center gap-1">
                                        <span className="bg-blue-500 text-white px-1 rounded text-xs">K{kotNumber}</span>
                                        <span>• {itemName} x{quantity}</span>
                                        {note && <span className="text-gray-500 text-xs"> ({note})</span>}
                                      </div>
                                    );
                                  })}
                                  {kot.items.length > 3 && (
                                    <div className="text-gray-500 text-xs">+{kot.items.length - 3} more items</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">No items</span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(kot.priority)}`}>
                              {kot.priority}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(kot.status)}`}>
                              {kot.status}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>{kot.assignedChef?.name || 'Unassigned'}</td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex flex-col sm:flex-row gap-1">
                              {kot.status === 'preparing' && (
                                <button
                                  onClick={() => updateKOTStatus(kot._id, 'ready', kot.orderId)}
                                  className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 whitespace-nowrap"
                                >
                                  Mark Ready
                                </button>
                              )}
                              {kot.status === 'ready' && (
                                canMarkAsServed() ? (
                                  <button
                                    onClick={() => markServed(kot._id)}
                                    className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 whitespace-nowrap"
                                  >
                                    Mark Served
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="bg-gray-300 text-gray-500 px-2 py-1 rounded text-xs cursor-not-allowed whitespace-nowrap"
                                    title="Only chefs can mark orders as served"
                                  >
                                    Mark Served
                                  </button>
                                )
                              )}
                              <button
                                onClick={() => printKOT(kot)}
                                className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 whitespace-nowrap flex items-center gap-1"
                                title="Print KOT"
                              >
                                <Printer className="w-3 h-3" />
                                Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredKots.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredKots.length}
                />
                
                {filteredKots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No KOTs found matching your search.' : 'No KOTs found.'}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'create' && (
              <div className="p-6">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl font-bold mb-4" style={{ color: 'hsl(45, 100%, 20%)' }}>Create New KOT</h2>
                  <form onSubmit={createKOT} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Select Order</label>
                <select
                  value={kotForm.orderId}
                  onChange={(e) => {
                    const selectedOrder = orders.find(o => o._id === e.target.value);
                    setKotForm({
                      ...kotForm,
                      orderId: e.target.value,
                      tableNo: selectedOrder?.tableNo || '',
                      items: selectedOrder?.items || []
                    });
                  }}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                  required
                >
                  <option value="">Select Order</option>
                  {orders.map(order => (
                    <option key={order._id} value={order._id}>
                      Order {order._id.slice(-6)} - Table {order.tableNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Table Number</label>
                <select
                  value={kotForm.tableNo}
                  onChange={(e) => setKotForm({...kotForm, tableNo: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                  required
                >
                  <option value="">Select Table</option>
                  {Array.isArray(tables) && tables.map(table => (
                    <option key={table._id} value={table.tableNumber}>
                      Table {table.tableNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Priority Level</label>
                <select
                  value={kotForm.priority}
                  onChange={(e) => setKotForm({...kotForm, priority: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Estimated Time (minutes)</label>
                <input
                  type="number"
                  placeholder="Enter estimated time"
                  value={kotForm.estimatedTime}
                  onChange={(e) => setKotForm({...kotForm, estimatedTime: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Assign Chef</label>
                <select
                  value={kotForm.assignedChef}
                  onChange={(e) => setKotForm({...kotForm, assignedChef: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                >
                  <option value="">Select Chef</option>
                  {chefs.map(chef => (
                    <option key={chef._id} value={chef._id}>
                      {chef.name || chef.username}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full p-3 rounded-lg font-semibold transition-colors shadow-md"
                style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
              >
                Create KOT
              </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default KOT;

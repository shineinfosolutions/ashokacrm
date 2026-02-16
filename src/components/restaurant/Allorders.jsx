import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import Pagination from '../common/Pagination';
import { useSocket } from '../../context/SocketContext';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import PaymentBill from '../Pantry/PaymentBill';
import RestaurantBill from '../Pantry/RestaurantBill';
import LiveOrderNotifications from './LiveOrderNotifications';
import AddItemsModal from './AddItemsModal';
import TransferTableModal from './TransferTableModal';
import { motion, AnimatePresence } from 'framer-motion';

const AllBookings = ({ setActiveTab }) => {
  const { axios } = useAppContext();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  // Real-time order updates
  const { isConnected } = useOrderSocket({
    onNewOrder: (data) => {
      console.log('📱 New order received in AllOrders:', data);
      fetchBookings(); // Refresh the orders list
    },
    onOrderStatusUpdate: (data) => {
      console.log('📱 Order status update in AllOrders:', data);
      fetchBookings(); // Refresh the orders list
    },
    onNewKOT: (data) => {
      console.log('📱 New KOT received in AllOrders:', data);
      fetchBookings(); // Refresh the orders list
    },
    onKOTStatusUpdate: (data) => {
      console.log('📱 KOT status update in AllOrders:', data);
      fetchBookings(); // Refresh the orders list
    },
    showNotifications: false // We use the LiveOrderNotifications component
  });
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferForm, setTransferForm] = useState({ orderId: '', newTable: '' });
  const [addItemsForm, setAddItemsForm] = useState({ orderId: '', itemId: '', quantity: 1 });
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ orderId: '', couponCode: '', isLoyalty: false, membership: '' });

  const [paymentForm, setPaymentForm] = useState({ orderId: '', amount: '', method: 'cash' });
  const [bills, setBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userRole, setUserRole] = useState(null);
  const [userRestaurantRole, setUserRestaurantRole] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedOrderForTransfer, setSelectedOrderForTransfer] = useState(null);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState(null);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [splitPayments, setSplitPayments] = useState([{ amount: '', method: 'cash' }]);
  const [showPayNowModal, setShowPayNowModal] = useState(false);
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'split'
  const [showFullPaymentModal, setShowFullPaymentModal] = useState(false);
  const [showPaymentBill, setShowPaymentBill] = useState(false);
  const [paymentBillData, setPaymentBillData] = useState(null);
  const [showRestaurantBill, setShowRestaurantBill] = useState(false);
  const [restaurantBillData, setRestaurantBillData] = useState(null);
  const [openInvoices, setOpenInvoices] = useState(new Map()); // Track open invoice windows
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserRole();
    fetchBookings();
    fetchTables();
    fetchItems();
    fetchCoupons();
    fetchBills();
  }, []);

  // Connection status indicator
  const connectionStatus = isConnected ? (
    <div className="flex items-center gap-2 text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium">Live Updates Active</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-red-600">
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <span className="text-sm font-medium">Offline Mode</span>
    </div>
  );

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(response.data.role);
      setUserRestaurantRole(response.data.restaurantRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched bookings:', response.data);
      console.log('Bookings count:', response.data?.length || 0);
      
      if (Array.isArray(response.data)) {
        setBookings(response.data);
      } else if (response.data && response.data.orders) {
        setBookings(response.data.orders);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tablesData = Array.isArray(response.data) ? response.data : (response.data.tables || []);
      setTables(tablesData);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/items/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/coupons/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched coupons:', response.data);
      
      // Handle different response structures
      let couponsData = [];
      if (Array.isArray(response.data)) {
        couponsData = response.data;
      } else if (response.data.coupon) {
        couponsData = [response.data.coupon];
      } else if (response.data.coupons) {
        couponsData = response.data.coupons;
      }
      
      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    }
  };

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bills/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setBills([]);
    }
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/coupons/apply', {
        orderId: couponForm.orderId,
        couponCode: couponForm.couponCode,
        isLoyalty: couponForm.isLoyalty,
        membership: couponForm.membership
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.success('Coupon applied successfully!');
      setCouponForm({ orderId: '', couponCode: '', isLoyalty: false, membership: '' });
      fetchBookings();
    } catch (error) {
      console.error('Error applying coupon:', error);
      showToast.error('Failed to apply coupon');
    }
  };

  const searchBookings = async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/search/field', {
        headers: { Authorization: `Bearer ${token}` },
        params: { model: 'restaurant-orders', field: 'customerName', value: query }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error searching bookings:', error);
    }
  };

  const viewDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/restaurant-orders/details/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrderDetails(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching details:', error);
      showToast.error('Failed to load order details');
    }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Create bill
      const billResponse = await axios.post('/api/bills/create', {
        orderId: paymentForm.orderId,
        discount: 0,
        tax: 0,
        paymentMethod: paymentForm.method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Process payment
      await axios.patch(`/api/bills/${billResponse.data._id}/payment`, {
        paidAmount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add transaction to order history
      await axios.patch(`/api/restaurant-orders/${paymentForm.orderId}/add-transaction`, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        billId: billResponse.data._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update order status to paid
      await axios.patch(`/api/restaurant-orders/${paymentForm.orderId}/status`, {
        status: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast.success('Payment processed successfully!');
      setPaymentForm({ orderId: '', amount: '', method: 'cash' });
      await fetchBills();
      await fetchBookings();
      
      // Generate invoice automatically
      // generateInvoice(paymentForm.orderId);
    } catch (error) {
      console.error('Error processing payment:', error);
      showToast.error('Failed to process payment');
    }
  };

  const processSplitPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Validate split payments
      const validPayments = splitPayments.filter(p => p.amount && parseFloat(p.amount) > 0);
      if (validPayments.length === 0) {
        showToast.error('Please add at least one payment amount');
        return;
      }
      
      const totalSplitAmount = validPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const orderAmount = selectedOrderForPayment?.amount || selectedOrderForPayment?.advancePayment || 0;
      
      if (Math.abs(totalSplitAmount - orderAmount) > 0.01) {
        showToast.error(`Split payment total (₹${totalSplitAmount}) must equal order amount (₹${orderAmount})`);
        return;
      }
      
      // Create bill first
      const billResponse = await axios.post('/api/bills/create', {
        orderId: selectedOrderForPayment._id,
        discount: 0,
        tax: 0,
        paymentMethod: 'split'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Process split payment
      await axios.patch(`/api/bills/${billResponse.data._id}/split-payment`, {
        payments: validPayments.map(p => ({
          amount: parseFloat(p.amount),
          method: p.method
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add each split payment to transaction history
      for (const payment of validPayments) {
        await axios.patch(`/api/restaurant-orders/${selectedOrderForPayment._id}/add-transaction`, {
          amount: parseFloat(payment.amount),
          method: payment.method,
          billId: billResponse.data._id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Update order status to paid
      await axios.patch(`/api/restaurant-orders/${selectedOrderForPayment._id}/status`, {
        status: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast.success('Split payment processed successfully!');
      setShowSplitPaymentModal(false);
      setSelectedOrderForPayment(null);
      setSplitPayments([{ amount: '', method: 'cash' }]);
      await fetchBills();
      await fetchBookings();
      
    } catch (error) {
      console.error('Error processing split payment:', error);
      showToast.error('Failed to process split payment');
    }
  };

  const addSplitPayment = () => {
    const orderAmount = selectedOrderForPayment?.amount || selectedOrderForPayment?.advancePayment || 0;
    const currentTotal = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const remainingAmount = Math.max(0, orderAmount - currentTotal);
    
    setSplitPayments([...splitPayments, { amount: remainingAmount > 0 ? remainingAmount.toString() : '', method: 'cash' }]);
  };

  const removeSplitPayment = (index) => {
    if (splitPayments.length > 1) {
      setSplitPayments(splitPayments.filter((_, i) => i !== index));
    }
  };

  const updateSplitPayment = (index, field, value) => {
    const updated = splitPayments.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    );
    setSplitPayments(updated);
  };

  const generateInvoice = async (orderId, invoiceType = 'tax') => {
    try {
      setLoadingInvoice(orderId);
      const token = localStorage.getItem('token');
      
      // Get current order data
      const currentOrder = bookings.find(b => b._id === orderId);
      if (!currentOrder) {
        showToast.error('Order not found');
        return;
      }
      
      // Use the stored amount from database (already calculated with NOC)
      const finalAmount = currentOrder.amount || currentOrder.advancePayment || 0;
      
      // Create invoice data with current items
      const invoiceData = {
        orderId: orderId,
        orderDetails: {
          _id: currentOrder._id,
          customerName: currentOrder.customerName || 'Guest',
          tableNo: currentOrder.tableNo,
          items: items,
          amount: finalAmount,
          totalAmount: finalAmount,
          status: currentOrder.status,
          createdAt: currentOrder.createdAt,
          kotCount: currentOrder.kotCount || 1
        }
      };
      
      // Check if invoice is already open for this order
      if (openInvoices.has(orderId)) {
        const existingWindow = openInvoices.get(orderId);
        if (existingWindow && !existingWindow.closed) {
          // Update existing invoice with new data
          existingWindow.postMessage({
            type: 'UPDATE_INVOICE',
            data: invoiceData
          }, '*');
          existingWindow.focus();
          showToast.success('Invoice updated with new items!');
          return;
        } else {
          // Remove closed window from tracking
          setOpenInvoices(prev => {
            const newMap = new Map(prev);
            newMap.delete(orderId);
            return newMap;
          });
        }
      }
      
      // Generate new invoice
      const response = await axios.get(`/api/restaurant-orders/invoice/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Invoice response:', response.data);
      
      let invoiceWindow;
      // Handle different response formats
      if (response.data.invoiceUrl) {
        invoiceWindow = window.open(response.data.invoiceUrl, `invoice_${orderId}`);
      } else if (response.data.url) {
        invoiceWindow = window.open(response.data.url, `invoice_${orderId}`);
      } else {
        // Navigate to appropriate invoice page with data
        const invoicePath = invoiceType === 'pos' ? '/pos-invoice' : '/invoice';
        navigate(invoicePath, {
          state: {
            bookingData: invoiceData.orderDetails,
            checkoutId: orderId
          }
        });
        return;
      }
      
      // Track the opened invoice window
      if (invoiceWindow) {
        setOpenInvoices(prev => new Map(prev).set(orderId, invoiceWindow));
        
        // Clean up when window is closed
        const checkClosed = setInterval(() => {
          if (invoiceWindow.closed) {
            setOpenInvoices(prev => {
              const newMap = new Map(prev);
              newMap.delete(orderId);
              return newMap;
            });
            clearInterval(checkClosed);
          }
        }, 1000);
      }
      
      showToast.success('Invoice generated successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast.error('Failed to generate invoice');
    } finally {
      setLoadingInvoice(null);
    }
  };

  const transferTable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/restaurant-orders/${transferForm.orderId}/transfer-table`, {
        newTableNo: transferForm.newTable,
        reason: 'Customer request'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.success('Table transferred successfully!');
      setTransferForm({ orderId: '', newTable: '' });
      setShowTransferModal(false);
      setSelectedOrderForTransfer(null);
      fetchBookings();
    } catch (error) {
      console.error('Error transferring table:', error);
      showToast.error('Failed to transfer table');
    }
  };

  const addItems = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const selectedItem = items.find(item => item._id === addItemsForm.itemId);
      if (!selectedItem) {
        showToast.error('Please select a valid item');
        return;
      }
      
      const currentOrder = bookings.find(b => b._id === addItemsForm.orderId);
      
      await axios.patch(`/api/restaurant-orders/${addItemsForm.orderId}/add-items`, {
        items: [{
          itemId: selectedItem._id,
          quantity: parseInt(addItemsForm.quantity) || 1
        }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create/Update KOT for the new item
      try {
        await axios.post('/api/kot/create', {
          orderId: addItemsForm.orderId,
          tableNo: currentOrder?.tableNo,
          items: [{
            itemId: selectedItem._id,
            itemName: selectedItem.name,
            quantity: 1,
            price: selectedItem.Price
          }]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('KOT updated for new item');
      } catch (kotError) {
        console.error('KOT update failed:', kotError);
      }
      
      // Update local state immediately
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === addItemsForm.orderId 
            ? { ...booking, items: [...(booking.items || []), selectedItem], allKotItems: [...(booking.allKotItems || []), selectedItem] }
            : booking
        )
      );
      
      // Update restaurant bill if it's open for this order
      if (showRestaurantBill && restaurantBillData && restaurantBillData._id === addItemsForm.orderId) {
        const updatedBooking = bookings.find(b => b._id === addItemsForm.orderId);
        if (updatedBooking) {
          setRestaurantBillData({
            ...restaurantBillData,
            items: [...(updatedBooking.allKotItems || updatedBooking.items || []), selectedItem]
          });
        }
      }
      
      // Update open invoice if it exists for this order
      if (openInvoices.has(addItemsForm.orderId)) {
        const invoiceWindow = openInvoices.get(addItemsForm.orderId);
        if (invoiceWindow && !invoiceWindow.closed) {
          const updatedBooking = bookings.find(b => b._id === addItemsForm.orderId);
          if (updatedBooking) {
            const invoiceData = {
              orderId: addItemsForm.orderId,
              orderDetails: {
                _id: updatedBooking._id,
                customerName: updatedBooking.customerName || 'Guest',
                tableNo: updatedBooking.tableNo,
                items: [...(updatedBooking.allKotItems || updatedBooking.items || []), selectedItem],
                totalAmount: updatedBooking.amount || updatedBooking.advancePayment || 0,
                status: updatedBooking.status,
                createdAt: updatedBooking.createdAt,
                kotCount: updatedBooking.kotCount || 1
              }
            };
            
            invoiceWindow.postMessage({
              type: 'UPDATE_INVOICE',
              data: invoiceData
            }, '*');
            
            showToast.success('Invoice updated with new item!');
          }
        }
      }
      
      showToast.success('Item added successfully!');
      setAddItemsForm({ orderId: '', itemId: '' });
      setShowAddItemsModal(false);
      setSelectedOrderForItems(null);
    } catch (error) {
      console.error('Error adding items:', error);
      showToast.error('Failed to add items');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchBookings(searchQuery);
    } else {
      fetchBookings();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'served',
      'served': 'completed'
    };
    return statusFlow[currentStatus];
  };

  const getStatusNotification = (status) => {
    const notifications = {
      'pending': '📋 Order received - Kitchen assignment needed',
      'preparing': '👨‍🍳 Kitchen preparing order - Monitor cooking progress',
      'ready': '🔔 Order ready - Notify server for pickup',
      'served': '✅ Order served - Check customer satisfaction',
      'completed': '🎉 Order completed - Process payment',
      'cancelled': '❌ Order cancelled - Notify customer'
    };
    return notifications[status] || 'Status updated';
  };

  const updateOrderStatusWithNotification = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/restaurant-orders/${bookingId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const notification = getStatusNotification(newStatus);
      showToast.success(`Status Updated! ${notification}`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error('Failed to update status');
    }
  };

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = bookings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };



  const canCompleteOrder = () => {
    return userRole === 'restaurant' && userRestaurantRole === 'cashier';
  };

  const updateOrderStatusWithRoleCheck = async (bookingId, newStatus) => {
    // Check if trying to mark as completed
    if (newStatus === 'completed' && !canCompleteOrder()) {
      showToast.error('Only cashiers can mark orders as completed!');
      return;
    }
    
    // Proceed with normal status update
    await updateOrderStatusWithNotification(bookingId, newStatus);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 bg-background min-h-screen"
    >
      <div className="w-full">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold text-text">All Bookings</h2>
            {connectionStatus}
          </div>
        </div>
        


        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="flex-1 p-2 border border-[#c3ad6b]/30 rounded bg-white text-gray-700 focus:border-[#c3ad6b] focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a] text-white px-4 py-2 rounded hover:from-[#b39b5a] hover:to-[#c3ad6b] transition-colors whitespace-nowrap text-sm"
            >
              Search
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Order ID</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Staff</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Phone</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Table</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Items</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Advance Payment</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Status</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking, index) => (
                  <motion.tr 
                    key={booking._id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={index % 2 === 0 ? 'bg-background' : 'bg-white'}
                  >
                    <td className="px-2 sm:px-4 py-3 text-text text-xs sm:text-sm font-mono">
                      <div className="font-semibold">{booking._id.slice(-6)}</div>
                      <div className="text-xs text-gray-500">{booking.customerName || 'Guest'}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-text text-xs sm:text-sm">{booking.staffName || 'N/A'}</td>
                    <td className="px-2 sm:px-4 py-3 text-text text-xs sm:text-sm">{booking.phoneNumber || 'N/A'}</td>
                    <td className="px-2 sm:px-4 py-3 text-text text-xs sm:text-sm">{booking.tableNo || 'N/A'}</td>
                    <td className="px-2 sm:px-4 py-3 text-text text-xs sm:text-sm">
                      {booking.allKotItems?.length || booking.items?.length || 0} items
                      {booking.kotCount > 1 && (
                        <span className="ml-1 bg-blue-100 text-blue-800 px-1 rounded text-xs">
                          {booking.kotCount} KOTs
                        </span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-text text-xs sm:text-sm">₹{booking.advancePayment || 0}</td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status || 'pending')}`}>
                          {booking.status || 'pending'}
                        </span>
                        {getNextStatus(booking.status) && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                          getNextStatus(booking.status) === 'completed' ? (
                            canCompleteOrder() ? (
                              <button
                                onClick={() => updateOrderStatusWithRoleCheck(booking._id, getNextStatus(booking.status))}
                                className="bg-primary text-white px-2 py-1 rounded text-xs hover:bg-hover transition-colors"
                              >
                                → {getNextStatus(booking.status)}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="bg-gray-300 text-gray-500 px-2 py-1 rounded text-xs cursor-not-allowed"
                                title="Only cashiers can complete orders"
                              >
                                → {getNextStatus(booking.status)}
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => updateOrderStatusWithNotification(booking._id, getNextStatus(booking.status))}
                              className="bg-primary text-white px-2 py-1 rounded text-xs hover:bg-hover transition-colors"
                            >
                              → {getNextStatus(booking.status)}
                            </button>
                          )
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'ready' && booking.status !== 'served' && booking.status !== 'paid' && (() => {
                          const orderTime = new Date(booking.createdAt);
                          const currentTime = new Date();
                          const timeDiff = (currentTime - orderTime) / (1000 * 60); // difference in minutes
                          return timeDiff <= 2; // Show cancel button only within 2 minutes
                        })() && (
                          <button
                            onClick={() => updateOrderStatusWithNotification(booking._id, 'cancelled')}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex flex-col sm:flex-row gap-1">
                        <button
                          onClick={() => viewDetails(booking._id)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 whitespace-nowrap"
                        >
                          View
                        </button>
                        {booking.status !== 'cancelled' && (
                          <>
                            <div className="flex gap-1">
                              <button
                                onClick={() => generateInvoice(booking._id, 'tax')}
                                disabled={loadingInvoice === booking._id}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 whitespace-nowrap disabled:opacity-50"
                              >
                                Tax Invoice
                              </button>
                              <button
                                onClick={() => generateInvoice(booking._id, 'pos')}
                                disabled={loadingInvoice === booking._id}
                                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 whitespace-nowrap disabled:opacity-50"
                              >
                                POS
                              </button>
                            </div>
                            {booking.status === 'completed' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedOrderForPayment(booking);
                                    setPaymentType('full');
                                    setSplitPayments([{ amount: (booking.amount || booking.advancePayment || 0).toString(), method: 'cash' }]);
                                    setShowPayNowModal(true);
                                  }}
                                  className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 whitespace-nowrap"
                                >
                                  Pay Now
                                </button>
                                <button
                                  onClick={() => {
                                    setRestaurantBillData({
                                      _id: booking._id,
                                      orderType: 'Restaurant Order',
                                      roomNumber: booking.tableNo,
                                      guestName: booking.customerName || 'Guest',
                                      items: booking.allKotItems || booking.items || [],
                                      totalAmount: booking.amount || booking.advancePayment || 0,
                                      notes: booking.specialRequests || ''
                                    });
                                    setShowRestaurantBill(true);
                                  }}
                                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 whitespace-nowrap"
                                >
                                  Bill
                                </button>
                              </>
                            )}
                            {!['served', 'completed', 'paid'].includes(booking.status) && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedOrderForItems(booking);
                                    setAddItemsForm({orderId: booking._id, itemId: ''});
                                    setShowAddItemsModal(true);
                                  }}
                                  className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 whitespace-nowrap"
                                >
                                  Add Items
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedOrderForTransfer(booking);
                                    setTransferForm({orderId: booking._id, newTable: ''});
                                    setShowTransferModal(true);
                                  }}
                                  className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 whitespace-nowrap"
                                >
                                  Transfer
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Loading bookings...
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-red-500">
              Error: {error}
              <button 
                onClick={fetchBookings}
                className="ml-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}
          
          {!loading && !error && paginatedBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bookings found.
              <div className="mt-2 text-sm">
                Total bookings: {bookings.length}
              </div>
            </div>
          )}
        </div>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={bookings.length}
        />
      </div>

      {/* Pay Now Modal */}
      <AnimatePresence>
      {showPayNowModal && selectedOrderForPayment && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-gradient-to-br from-black to-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border-2 border-yellow-500 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-yellow-400">💰 Payment Options</h3>
              <button
                onClick={() => {
                  setShowPayNowModal(false);
                  setSelectedOrderForPayment(null);
                  setPaymentType('full');
                }}
                className="text-yellow-400 hover:text-yellow-300 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-lg border border-yellow-500/30">
                <div className="font-bold text-yellow-400 text-lg mb-2">📋 Order Summary</div>
                <div className="text-yellow-100 space-y-1">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono text-yellow-300">#{selectedOrderForPayment._id?.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span className="font-semibold text-yellow-300">{selectedOrderForPayment.tableNo}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-yellow-500/30 pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span className="text-yellow-400">₹{selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center font-bold text-yellow-400 text-lg">Choose Payment Method:</div>
                
                <button
                  onClick={() => {
                    setPaymentType('full');
                    setShowPayNowModal(false);
                    setShowFullPaymentModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-4 px-6 rounded-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 font-bold text-lg shadow-lg transform hover:scale-105"
                >
                  💳 Full Payment
                  <div className="text-sm font-medium opacity-90 mt-1">Pay ₹{selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0} at once</div>
                </button>
                
                <button
                  onClick={() => {
                    setPaymentType('split');
                    setSplitPayments([{ amount: (selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0).toString(), method: 'cash' }]);
                    setShowPayNowModal(false);
                    setShowSplitPaymentModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-yellow-400 py-4 px-6 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-bold text-lg border-2 border-yellow-500/50 shadow-lg transform hover:scale-105"
                >
                  🔄 Split Bill
                  <div className="text-sm font-medium opacity-90 mt-1">Pay with multiple methods</div>
                </button>
              </div>
              
              <div className="flex justify-center pt-4 border-t border-yellow-500/30">
                <button
                  onClick={() => {
                    setShowPayNowModal(false);
                    setSelectedOrderForPayment(null);
                    setPaymentType('full');
                  }}
                  className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Full Payment Method Modal */}
      <AnimatePresence>
      {showFullPaymentModal && selectedOrderForPayment && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-gradient-to-br from-black to-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border-2 border-yellow-500 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-yellow-400">💳 Select Payment Method</h3>
              <button
                onClick={() => {
                  setShowFullPaymentModal(false);
                  setSelectedOrderForPayment(null);
                }}
                className="text-yellow-400 hover:text-yellow-300 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-lg border border-yellow-500/30">
                <div className="font-bold text-yellow-400 text-lg mb-2">📋 Payment Details</div>
                <div className="text-yellow-100 space-y-1">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono text-yellow-300">#{selectedOrderForPayment._id?.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span className="font-semibold text-yellow-300">{selectedOrderForPayment.tableNo}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-yellow-500/30 pt-2 mt-2">
                    <span>Amount to Pay:</span>
                    <span className="text-yellow-400">₹{selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center font-bold text-yellow-400 text-lg">Choose Payment Method:</div>
                
                <button
                  onClick={async () => {
                    const paymentData = {
                      orderId: selectedOrderForPayment._id,
                      amount: (selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0).toString(),
                      method: 'cash'
                    };
                    setPaymentForm(paymentData);
                    setShowFullPaymentModal(false);
                    
                    // Process payment directly with the data
                    try {
                      const token = localStorage.getItem('token');
                      
                      const billResponse = await axios.post('/api/bills/create', {
                        orderId: paymentData.orderId,
                        discount: 0,
                        tax: 0,
                        paymentMethod: paymentData.method
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/bills/${billResponse.data._id}/payment`, {
                        paidAmount: parseFloat(paymentData.amount),
                        paymentMethod: paymentData.method
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/restaurant-orders/${paymentData.orderId}/add-transaction`, {
                        amount: parseFloat(paymentData.amount),
                        method: paymentData.method,
                        billId: billResponse.data._id
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/restaurant-orders/${paymentData.orderId}/status`, {
                        status: 'paid'
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      showToast.success('Cash payment processed successfully!');
                      await fetchBills();
                      await fetchBookings();
                    } catch (error) {
                      console.error('Error processing cash payment:', error);
                      showToast.error('Failed to process cash payment');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 font-medium shadow-lg transform hover:scale-105"
                >
                  💵 Cash Payment
                </button>
                
                <button
                  onClick={async () => {
                    const paymentData = {
                      orderId: selectedOrderForPayment._id,
                      amount: (selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0).toString(),
                      method: 'card'
                    };
                    setShowFullPaymentModal(false);
                    
                    try {
                      const token = localStorage.getItem('token');
                      
                      const billResponse = await axios.post('/api/bills/create', {
                        orderId: paymentData.orderId,
                        discount: 0,
                        tax: 0,
                        paymentMethod: paymentData.method
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/bills/${billResponse.data._id}/payment`, {
                        paidAmount: parseFloat(paymentData.amount),
                        paymentMethod: paymentData.method
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/restaurant-orders/${paymentData.orderId}/add-transaction`, {
                        amount: parseFloat(paymentData.amount),
                        method: paymentData.method,
                        billId: billResponse.data._id
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/restaurant-orders/${paymentData.orderId}/status`, {
                        status: 'paid'
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      showToast.success('Card payment processed successfully!');
                      await fetchBills();
                      await fetchBookings();
                    } catch (error) {
                      console.error('Error processing card payment:', error);
                      showToast.error('Failed to process card payment');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 font-medium shadow-lg transform hover:scale-105"
                >
                  💳 Card Payment
                </button>
                
                <button
                  onClick={async () => {
                    const paymentData = {
                      orderId: selectedOrderForPayment._id,
                      amount: (selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0).toString(),
                      method: 'upi'
                    };
                    setShowFullPaymentModal(false);
                    
                    try {
                      const token = localStorage.getItem('token');
                      
                      const billResponse = await axios.post('/api/bills/create', {
                        orderId: paymentData.orderId,
                        discount: 0,
                        tax: 0,
                        paymentMethod: paymentData.method
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/bills/${billResponse.data._id}/payment`, {
                        paidAmount: parseFloat(paymentData.amount),
                        paymentMethod: paymentData.method
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/restaurant-orders/${paymentData.orderId}/add-transaction`, {
                        amount: parseFloat(paymentData.amount),
                        method: paymentData.method,
                        billId: billResponse.data._id
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      await axios.patch(`/api/restaurant-orders/${paymentData.orderId}/status`, {
                        status: 'paid'
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      
                      showToast.success('UPI payment processed successfully!');
                      await fetchBills();
                      await fetchBookings();
                    } catch (error) {
                      console.error('Error processing UPI payment:', error);
                      showToast.error('Failed to process UPI payment');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-300 font-medium shadow-lg transform hover:scale-105"
                >
                  📱 UPI Payment
                </button>
              </div>
              
              <div className="flex justify-center pt-4 border-t border-yellow-500/30">
                <button
                  onClick={() => {
                    setShowFullPaymentModal(false);
                    setShowPayNowModal(true);
                  }}
                  className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                >
                  ← Back to Payment Options
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Split Payment Modal */}
      <AnimatePresence>
      {showSplitPaymentModal && selectedOrderForPayment && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Split Payment</h3>
              <button
                onClick={() => {
                  setShowSplitPaymentModal(false);
                  setSelectedOrderForPayment(null);
                  setSplitPayments([{ amount: '', method: 'cash' }]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-100 rounded">
                <div className="font-semibold">Order Details:</div>
                <div className="text-sm mt-1">
                  <div>Order ID: {selectedOrderForPayment._id?.slice(-6)}</div>
                  <div>Table: {selectedOrderForPayment.tableNo}</div>
                  <div>Total Amount: ₹{selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0}</div>
                </div>
              </div>
              
              <form onSubmit={processSplitPayment} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block font-semibold">Payment Methods:</label>
                    <button
                      type="button"
                      onClick={addSplitPayment}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      + Add
                    </button>
                  </div>
                  
                  {splitPayments.map((payment, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={payment.amount}
                        onChange={(e) => updateSplitPayment(index, 'amount', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-yellow-500 focus:outline-none"
                        required
                      />
                      <select
                        value={payment.method}
                        onChange={(e) => updateSplitPayment(index, 'method', e.target.value)}
                        className="p-2 border border-gray-300 rounded focus:border-yellow-500 focus:outline-none"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="online">Online</option>
                      </select>
                      {splitPayments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSplitPayment(index)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <div className="text-sm">
                    <div className="text-gray-600">
                      Total: ₹{splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2)} / ₹{selectedOrderForPayment.amount || selectedOrderForPayment.advancePayment || 0}
                    </div>
                    {(() => {
                      const orderAmount = selectedOrderForPayment?.amount || selectedOrderForPayment?.advancePayment || 0;
                      const currentTotal = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                      const remaining = orderAmount - currentTotal;
                      return remaining > 0 ? (
                        <div className="text-orange-600 font-medium">
                          Remaining: ₹{remaining.toFixed(2)}
                        </div>
                      ) : remaining < 0 ? (
                        <div className="text-red-600 font-medium">
                          Excess: ₹{Math.abs(remaining).toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-green-600 font-medium">
                          ✓ Amount matched
                        </div>
                      );
                    })()} 
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSplitPaymentModal(false);
                      setSelectedOrderForPayment(null);
                      setSplitPayments([{ amount: '', method: 'cash' }]);
                    }}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    Process Payment
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
      {showDetailsModal && selectedOrderDetails && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Order Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">Order ID:</label>
                  <p>{selectedOrderDetails._id?.slice(-6)}</p>
                </div>
                <div>
                  <label className="font-semibold">Customer Name:</label>
                  <p>{selectedOrderDetails.customerName || 'Guest'}</p>
                </div>
                <div>
                  <label className="font-semibold">Table Number:</label>
                  <p>{selectedOrderDetails.tableNo}</p>
                </div>
                <div>
                  <label className="font-semibold">Status:</label>
                  <p className={`px-2 py-1 rounded text-sm inline-block ${
                    selectedOrderDetails.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    selectedOrderDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedOrderDetails.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrderDetails.status}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="font-semibold">Items ({selectedOrderDetails.kotCount || 1} KOT{(selectedOrderDetails.kotCount || 1) > 1 ? 's' : ''}):</label>
                <div className="mt-2 space-y-2">
                  {(selectedOrderDetails.allKotItems || selectedOrderDetails.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-500 text-white px-1 rounded text-xs">K{item.kotNumber || 1}</span>
                        <span>{typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item')}</span>
                        <span className="text-gray-500 text-sm">×{item.quantity || 1}</span>
                        {item.isFree && (
                          <span className="bg-green-100 text-green-800 px-1 rounded text-xs">NOC</span>
                        )}
                      </div>
                      <span>
                        {item.isFree ? (
                          <div className="text-right">
                            <span className="line-through text-gray-400">₹{typeof item === 'object' ? (item.price || item.Price || 0) : 0}</span>
                            <div className="text-green-600 font-bold text-sm">FREE</div>
                          </div>
                        ) : (
                          <span>₹{typeof item === 'object' ? (item.price || item.Price || 0) : 0}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>₹{selectedOrderDetails.amount || selectedOrderDetails.totalAmount || selectedOrderDetails.advancePayment || 0}</span>
                </div>
              </div>
              
              {selectedOrderDetails.specialRequests && (
                <div>
                  <label className="font-semibold">Special Requests:</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{selectedOrderDetails.specialRequests}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Payment Bill Modal */}
      {showPaymentBill && paymentBillData && (
        <PaymentBill 
          order={paymentBillData.order}
          vendor={paymentBillData.vendor}
          onClose={() => {
            setShowPaymentBill(false);
            setPaymentBillData(null);
          }}
        />
      )}

      {/* Restaurant Bill Modal */}
      {showRestaurantBill && restaurantBillData && (
        <RestaurantBill 
          order={restaurantBillData}
          onClose={() => {
            setShowRestaurantBill(false);
            setRestaurantBillData(null);
          }}
          onBillUpdate={(billData) => {
            console.log('Restaurant bill updated:', billData);
          }}
        />
      )}
      
      {/* Live Order Notifications */}
      <LiveOrderNotifications />
      
      {/* Add Items Modal */}
      <AddItemsModal
        isOpen={showAddItemsModal}
        onClose={() => {
          setShowAddItemsModal(false);
          setSelectedOrderForItems(null);
        }}
        selectedOrder={selectedOrderForItems}
        onItemAdded={fetchBookings}
      />
      
      {/* Transfer Table Modal */}
      <TransferTableModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedOrderForTransfer(null);
        }}
        selectedOrder={selectedOrderForTransfer}
        onTransferComplete={fetchBookings}
      />
    </motion.div>
  );
};

export default AllBookings;

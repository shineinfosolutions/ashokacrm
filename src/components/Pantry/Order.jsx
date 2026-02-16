import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import { Plus, Edit, Trash2, Package, Clock, User, MapPin } from 'lucide-react';
import PantryInvoice from './PantryInvoice';
import DashboardLoader from '../DashboardLoader';
import AutoVendorNotification from './AutoVendorNotification';

const Order = () => {
  const { axios } = useAppContext();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [vendorAnalytics, setVendorAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showFormAnalytics, setShowFormAnalytics] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentVendor, setPaymentVendor] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [fulfillmentOrder, setFulfillmentOrder] = useState(null);
  const [fulfillmentData, setFulfillmentData] = useState({
    previousAmount: 0,
    newAmount: 0,
    notes: '',
    pricingImage: null
  });
  const [showChalanModal, setShowChalanModal] = useState(false);
  const [chalanOrder, setChalanOrder] = useState(null);
  const [chalanFile, setChalanFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutoVendorNotification, setShowAutoVendorNotification] = useState(false);
  const [autoVendorData, setAutoVendorData] = useState({ outOfStockItems: [], autoVendorOrder: null });

  // Form state
  const [formData, setFormData] = useState({
    orderType: '',
    selectedItems: [],
    priority: 'medium',
    notes: '',
    totalAmount: 0,
    vendor: '',
    guestName: '',
    packagingCharge: 0,
    labourCharge: 0
  });
  

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      // Load orders first (most critical)
      await fetchOrders();
      setIsInitialLoading(false);
      
      // Load other data in background
      fetchPantryItems();
      fetchVendors();
    };
    loadInitialData();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/pantry/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(data.orders || data.data || data || []);
    } catch (error) {
      setOrders([]);
    }
  };

  const fetchPantryItems = async () => {
    try {
      const { data } = await axios.get('/api/pantry/items', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      let items = [];
      if (Array.isArray(data)) items = data;
      else if (data.items && Array.isArray(data.items)) items = data.items;
      else if (data.data && Array.isArray(data.data)) items = data.data;
      
      setPantryItems(items);
    } catch (error) {
      setPantryItems([]);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/vendor/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(Array.isArray(response.data) ? response.data : (response.data.vendors || []));
    } catch (err) {
      setVendors([]);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (formData.selectedItems.length === 0) {
      showToast.error('Please add at least one item');
      return;
    }

    // Filter out items without valid pantryItemId and validate quantities
    const validItems = formData.selectedItems.filter((item, index) => {
      if (!item.pantryItemId || item.pantryItemId === '') {
        showToast.error(`Item ${index + 1} must have a valid selection`);
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        showToast.error(`Item ${index + 1} must have a valid quantity`);
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      showToast.error('Please ensure all items have valid selections and quantities');
      return;
    }

    if (validItems.length !== formData.selectedItems.length) {
      showToast.error(`${formData.selectedItems.length - validItems.length} items were invalid and removed`);
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        orderType: formData.orderType,
        guestName: formData.guestName || 'Guest',
        items: validItems.map(item => ({
          itemId: item.pantryItemId,
          pantryItemId: item.pantryItemId,
          name: item.name,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice) || 0,
          notes: item.notes || ''
        })),
        priority: formData.priority,
        notes: formData.notes,
        totalAmount: formData.totalAmount,
        packagingCharge: Number(formData.packagingCharge) || 0,
        labourCharge: Number(formData.labourCharge) || 0,
        vendorId: formData.vendor || null
      };
      
      if (editingOrder) {
        await axios.put(`/api/pantry/orders/${editingOrder._id}`, orderData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showToast.success('Order updated successfully');
      } else {
        const response = await axios.post('/api/pantry/orders', orderData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Handle auto vendor ordering response
        if (response.data.outOfStockItems && response.data.outOfStockItems.length > 0) {
          const outOfStockCount = response.data.outOfStockItems.length;
          const outOfStockNames = response.data.outOfStockItems.map(item => item.name).join(', ');
          
          // Show notification component
          setAutoVendorData({
            outOfStockItems: response.data.outOfStockItems,
            autoVendorOrder: response.data.autoVendorOrder
          });
          setShowAutoVendorNotification(true);
          
          showToast.success(
            `Order created! ${outOfStockCount} out-of-stock items detected - Vendor order auto-created.`,
            { duration: 6000 }
          );
        } else {
          showToast.success('Order created successfully');
        }
      }

      resetForm();
    } catch (error) {
      console.error('Order submission error:', error.response?.data);
      showToast.error(error.response?.data?.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await axios.delete(`/api/pantry/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Update local state immediately without refreshing
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      
      showToast.success('Order deleted successfully');
    } catch (error) {
      showToast.error('Failed to delete order');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const order = orders.find(o => o._id === orderId);
    let confirmMessage = `Are you sure you want to change the order status to "${newStatus.toUpperCase()}"?\n\nThis action cannot be undone.`;
    
    if (newStatus === 'fulfilled' && order?.orderType === 'Pantry to vendor') {
      confirmMessage += '\n\nThis will also update the pantry inventory by adding the received quantities from the vendor.';
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      // Update local state immediately for better UX (WebSocket will sync)
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );
      
      await axios.put(`/api/pantry/orders/${orderId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      showToast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update error:', error.response?.data);
      
      // Revert local state on error
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === orderId ? { ...o, status: order.status } : o
        )
      );
      
      // If that fails, try to get the full order and update it properly
      try {
        const { data } = await axios.get(`/api/pantry/orders`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const currentOrder = data.orders?.find(o => o._id === orderId);
        
        if (currentOrder) {
          // Fix items to have proper itemId
          const fixedItems = currentOrder.items?.map(item => ({
            ...item,
            itemId: item.itemId || item.pantryItemId || item._id
          })) || [];
          
          const updatedOrder = {
            ...currentOrder,
            status: newStatus,
            items: fixedItems
          };
          
          await axios.put(`/api/pantry/orders/${orderId}`, updatedOrder, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          // Update local state again
          setOrders(prevOrders => 
            prevOrders.map(o => 
              o._id === orderId ? { ...o, status: newStatus } : o
            )
          );
          
          showToast.success(`Order status updated to ${newStatus}`);
        } else {
          showToast.error('Order not found');
        }
      } catch (secondError) {
        console.error('Second attempt failed:', secondError.response?.data);
        showToast.error('Failed to update order status');
      }
    }
  };

  const addItem = () => {
    // Lazy load pantry items if not loaded yet
    if (pantryItems.length === 0) {
      fetchPantryItems();
      showToast.info('Loading pantry items...');
      return;
    }
    
    // For Pantry to vendor and Kitchen to Pantry orders, allow any item (even out of stock)
    // For other orders, find first item with stock > 0
    let availableItem;
    if (formData.orderType === 'Pantry to vendor' || formData.orderType === 'Kitchen to Pantry') {
      availableItem = pantryItems[0]; // Use first item regardless of stock
    } else {
      availableItem = pantryItems.find(item => (item.stockQuantity || 0) > 0);
      if (!availableItem) {
        showToast.error('No items with available stock. Please restock items first.');
        return;
      }
    }
    
    if (!availableItem || !availableItem._id) {
      showToast.error('Invalid item selected. Please try again.');
      return;
    }
    
    console.log('Adding item:', availableItem);
    setFormData(prev => {
      const newItem = {
        pantryItemId: availableItem._id,
        name: availableItem.name,
        quantity: 1,
        unit: availableItem.unit || 'pcs',
        unitPrice: availableItem.price || 0,
        notes: ''
      };
      
      const updatedItems = [...prev.selectedItems, newItem];
      const totalAmount = updatedItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      
      const newFormData = {
        ...prev,
        selectedItems: updatedItems,
        totalAmount: totalAmount
      };
      console.log('Updated formData:', newFormData);
      return newFormData;
    });
  };

  const removeItem = (index) => {
    setFormData(prev => {
      const updatedItems = prev.selectedItems.filter((_, i) => i !== index);
      const totalAmount = updatedItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      
      return {
        ...prev,
        selectedItems: updatedItems,
        totalAmount: totalAmount
      };
    });
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.selectedItems];
      if (field === 'pantryItemId') {
        const selectedItem = pantryItems.find(item => item._id === value);
        if (selectedItem) {
          updatedItems[index] = {
            ...updatedItems[index],
            pantryItemId: value,
            name: selectedItem.name,
            unit: selectedItem.unit,
            unitPrice: selectedItem.price || 0
          };
        }
      } else {
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: field === 'quantity' || field === 'unitPrice' ? Number(value) : value
        };
      }
      
      // Calculate total amount
      const totalAmount = updatedItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      
      return { 
        ...prev, 
        selectedItems: updatedItems,
        totalAmount: totalAmount
      };
    });
  };

  const resetForm = () => {
    setFormData({
      orderType: '',
      selectedItems: [],
      priority: 'medium',
      notes: '',
      totalAmount: 0,
      vendor: '',
      guestName: '',
      packagingCharge: 0,
      labourCharge: 0
    });
    setEditingOrder(null);
    setShowOrderForm(false);
  };



  const getVendorName = (vendorId) => {
    if (!vendorId) return 'N/A';
    
    // Handle if vendorId is an object with _id property
    const id = typeof vendorId === 'object' ? vendorId._id : vendorId;
    
    const vendor = vendors.find(v => v._id === id);
    return vendor?.name || 'N/A';
  };



  const handleEditOrder = (order) => {
    setEditingOrder(order);
    
    // Ensure items have proper pantryItemId mapping
    const mappedItems = (order.items || []).map(item => ({
      pantryItemId: item.itemId || item.pantryItemId || '',
      name: item.name || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      unitPrice: item.unitPrice || 0,
      notes: item.notes || ''
    }));
    
    setFormData({
      orderType: order.orderType || 'Kitchen to Pantry',
      selectedItems: mappedItems,
      priority: order.priority || 'medium',
      notes: order.notes || '',
      totalAmount: order.totalAmount || 0,
      guestName: order.guestName || '',
      packagingCharge: order.packagingCharge || 0,
      labourCharge: order.labourCharge || 0,
      vendor: typeof order.vendorId === 'object' ? order.vendorId._id : (order.vendorId || '')
    });
    setShowOrderForm(true);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      fulfilled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending'}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const colors = {
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
        {paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1) || 'Pending'}
      </span>
    );
  };

  const updatePaymentStatus = async (orderId, paymentData) => {
    try {
      console.log(`🔍 Updating payment status for order ${orderId}...`);
      
      // Find the current order in local state
      const currentOrder = orders.find(o => o._id === orderId);
      
      if (!currentOrder) {
        console.error('❌ Order not found:', orderId);
        showToast.error('Order not found');
        return;
      }

      // Update local state immediately for better UX
      const updatedPaymentDetails = {
        paidAmount: paymentData.paidAmount || 0,
        paidAt: paymentData.paymentStatus === 'paid' ? new Date() : null,
        paymentMethod: paymentData.paymentMethod || 'UPI',
        transactionId: paymentData.transactionId || '',
        notes: paymentData.notes || ''
      };
      
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === orderId ? {
            ...o, 
            paymentStatus: paymentData.paymentStatus,
            paymentDetails: updatedPaymentDetails
          } : o
        )
      );

      // Update the order with payment status
      const updatedOrder = {
        ...currentOrder,
        paymentStatus: paymentData.paymentStatus,
        paymentDetails: updatedPaymentDetails
      };
      
      console.log('📝 Sending updated order to backend:', { id: updatedOrder._id, paymentStatus: updatedOrder.paymentStatus, paymentMethod: updatedOrder.paymentDetails.paymentMethod });

      const response = await axios.put(`/api/pantry/orders/${orderId}`, updatedOrder, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('✅ Backend response:', response.data);
      console.log('✅ Payment status updated without refresh');
    } catch (error) {
      console.error('❌ Payment status update error:', error.response?.data || error.message);
      
      // Revert local state on error
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === orderId ? currentOrder : o
        )
      );
      
      throw error;
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-blue-100 text-blue-800'}`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1) || 'Medium'}
      </span>
    );
  };

  const getVendorAnalytics = (vendorId) => {
    const allVendorOrders = orders.filter(order => {
      if (!order.vendorId) return false;
      const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
      return id === vendorId;
    });
    
    return {
      vendor: vendors.find(v => v._id === vendorId),
      total: {
        orders: allVendorOrders.length,
        amount: allVendorOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        items: allVendorOrders.reduce((sum, order) => sum + (order.items?.length || 0), 0)
      },
      statusBreakdown: {
        pending: allVendorOrders.filter(o => o.status === 'pending').length,
        approved: allVendorOrders.filter(o => o.status === 'approved').length,
        fulfilled: allVendorOrders.filter(o => o.status === 'fulfilled').length,
        cancelled: allVendorOrders.filter(o => o.status === 'cancelled').length
      },
      allOrders: allVendorOrders
    };
  };

  const fetchVendorAnalyticsFromAPI = async (vendorId) => {
    // Use local calculation for faster response
    return getVendorAnalytics(vendorId);
  };

  const handleVendorSelect = (vendorId) => {
    setFilterVendor(vendorId);
    if (vendorId) {
      const analytics = getVendorAnalytics(vendorId);
      setVendorAnalytics(analytics);
      setShowAnalytics(true);
    } else {
      setVendorAnalytics(null);
      setShowAnalytics(false);
    }
  };

  const exportToExcel = async () => {
    try {
      let url = `/api/pantry/orders/excel-report?`;
      const params = new URLSearchParams();
      
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('orderType', filterType);
      if (filterVendor) params.append('vendorId', filterVendor);
      
      const response = await axios.get(url + params.toString(), {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      const contentType = response.headers['content-type'] || '';
      let mimeType, fileExtension;
      
      if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      } else {
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
      }
      
      const blob = new Blob([response.data], { type: mimeType });
      const link = document.createElement('a');
      const downloadUrl = URL.createObjectURL(blob);
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', `pantry-orders-${new Date().toISOString().split('T')[0]}.${fileExtension}`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      showToast.success(`${fileExtension.toUpperCase()} report downloaded successfully`);
    } catch (error) {
      console.error('Export error:', error);
      showToast.error('Failed to export report');
    }
  };

  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filterStatus && order.status !== filterStatus) return false;
    
    // Type filter
    if (filterType && order.orderType !== filterType) return false;
    
    // Vendor filter
    if (filterVendor) {
      if (!order.vendorId) return false;
      const orderId = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
      if (orderId !== filterVendor) return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const orderNumber = (order.orderNumber || order._id?.slice(-8) || '').toLowerCase();
      const vendorName = getVendorName(order.vendorId).toLowerCase();
      const itemNames = (order.items || []).map(item => {
        let itemName = item.name || item.itemName || '';
        if (!itemName && (item.itemId || item.pantryItemId)) {
          const pantryItem = pantryItems.find(p => p._id === (item.itemId || item.pantryItemId));
          itemName = pantryItem?.name || '';
        }
        return itemName.toLowerCase();
      }).join(' ');
      
      const searchableText = `${orderNumber} ${vendorName} ${itemNames} ${order.orderType || ''} ${order.status || ''}`;
      if (!searchableText.includes(query)) return false;
    }
    
    return true;
  });

  const generateInvoice = (order) => {
    let vendor = null;
    if (order.vendorId) {
      const vendorId = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
      vendor = vendors.find(v => v && v._id === vendorId) || null;
    }
    
    const subtotal = order.totalAmount || 0;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    setInvoiceData({
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      order,
      vendor,
      subtotal,
      tax,
      total
    });
    setShowInvoice(true);
  };

  const downloadPDF = () => {
    window.print();
  };

  const handleViewOrder = (order) => {
    setViewingOrder(order);
    setShowViewModal(true);
  };

  const handleFulfillOrder = (order) => {
    setFulfillmentOrder(order);
    setFulfillmentData({
      previousAmount: order.totalAmount || 0,
      newAmount: order.totalAmount || 0,
      notes: '',
      pricingImage: null
    });
    setShowFulfillmentModal(true);
  };

  const submitFulfillment = async () => {
    if (!fulfillmentOrder) return;
    
    setLoading(true);
    try {
      const requestData = {
        previousAmount: fulfillmentData.previousAmount,
        newAmount: fulfillmentData.newAmount,
        difference: fulfillmentData.newAmount - fulfillmentData.previousAmount,
        notes: fulfillmentData.notes
      };

      await axios.put(`/api/pantry/fulfill-invoice/${fulfillmentOrder._id}`, requestData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      showToast.success('Order fulfilled successfully');
      setShowFulfillmentModal(false);
      setFulfillmentOrder(null);
      fetchOrders();
    } catch (error) {
      showToast.error('Failed to fulfill order');
    } finally {
      setLoading(false);
    }
  };

  const handleChalanUpload = (order) => {
    setChalanOrder(order);
    setShowChalanModal(true);
  };

  const submitChalan = async () => {
    if (!chalanOrder || !chalanFile) {
      showToast.error('Please select a chalan image');
      return;
    }
    
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const requestData = {
            orderId: chalanOrder._id,
            image: {
              base64: reader.result,
              name: chalanFile.name
            }
          };

          const response = await axios.post('/api/pantry/upload-chalan', requestData, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            showToast.success('Chalan uploaded successfully');
            setShowChalanModal(false);
            setChalanOrder(null);
            setChalanFile(null);
            fetchOrders();
          }
        } catch (error) {
          console.error('Chalan upload error:', error);
          showToast.error(error.response?.data?.error || 'Failed to upload chalan');
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        showToast.error('Failed to read file');
        setLoading(false);
      };
      
      reader.readAsDataURL(chalanFile);
    } catch (error) {
      console.error('File processing error:', error);
      showToast.error('Failed to process file');
      setLoading(false);
    }
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Pantry Orders" />;
  }

  return (
    <div className="p-4 sm:p-6 overflow-auto h-full bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f2937]">Pantry Orders</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Total: {orders.length} | Pending: {orders.filter(o => o.status === 'pending').length} | 
            Fulfilled: {orders.filter(o => o.status === 'fulfilled').length}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setLoading(true);
              Promise.all([fetchOrders(), fetchPantryItems(), fetchVendors()])
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Export Excel
          </button>
          <button
            onClick={() => {
              if (filterVendor) {
                const selectedVendor = vendors.find(v => v._id === filterVendor);
                setFormData(prev => ({
                  ...prev,
                  vendor: filterVendor,
                  orderType: 'Reception to Vendor'
                }));
              }
              setShowOrderForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Create Order{filterVendor ? ' for Selected Vendor' : ''}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders by ID, vendor, items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            Clear
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All Types</option>
            <option value="Kitchen to Pantry">Kitchen to Pantry</option>
            <option value="Pantry to Kitchen">Pantry to Kitchen</option>
            <option value="Pantry to vendor">Pantry to Vendor</option>
          </select>

          <select
            value={filterVendor}
            onChange={(e) => handleVendorSelect(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor Payment Info */}
      {filterVendor && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Payment Info: {vendors.find(v => v._id === filterVendor)?.name}
              </h3>
              <div className="text-sm text-gray-600 mb-2">
                <strong>UPI ID:</strong> 
                {vendors.find(v => v._id === filterVendor)?.UpiID ? (
                  <span className="ml-2">
                    <span className="text-blue-600">{vendors.find(v => v._id === filterVendor)?.UpiID}</span>
                    {(() => {
                      const unpaidOrders = orders.filter(order => {
                        if (!order.vendorId) return false;
                        const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                        return id === filterVendor && order.paymentStatus !== 'paid';
                      });
                      return unpaidOrders.length > 0 ? (
                        <button
                          onClick={() => {
                            const vendor = vendors.find(v => v._id === filterVendor);
                            setPaymentVendor({
                              ...vendor,
                              totalAmount: unpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                            });
                            setShowPaymentModal(true);
                          }}
                          className="ml-3 px-3 py-1 bg-orange-500 text-white text-xs rounded-md hover:bg-orange-600 transition-colors"
                        >
                          Pay Now (₹{unpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)})
                        </button>
                      ) : (
                        <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                          All Paid ✓
                        </span>
                      );
                    })()}
                  </span>
                ) : 'Not provided'}
              </div>
              {vendorAnalytics?.total?.amount > 0 && (
                <div className="text-sm text-green-600 font-medium">
                  Total Amount: ₹{vendorAnalytics.total.amount.toFixed(2)}
                </div>
              )}
            </div>
            {vendors.find(v => v._id === filterVendor)?.scannerImg && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-2">QR Code</span>
                <img 
                  src={vendors.find(v => v._id === filterVendor)?.scannerImg} 
                  alt="Payment QR Code" 
                  className="w-24 h-24 object-cover rounded border cursor-pointer hover:scale-105 transition-transform shadow-md"
                  onClick={() => {
                    const unpaidOrders = orders.filter(order => {
                      if (!order.vendorId) return false;
                      const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                      return id === filterVendor && order.paymentStatus !== 'paid';
                    });
                    if (unpaidOrders.length > 0) {
                      const vendor = vendors.find(v => v._id === filterVendor);
                      setPaymentVendor({
                        ...vendor,
                        totalAmount: unpaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                      });
                      setShowPaymentModal(true);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendor Analytics */}
      {showAnalytics && vendorAnalytics && (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Analytics: {vendorAnalytics.vendor?.name}
            </h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-gray-500 hover:text-gray-700 text-lg sm:text-base self-end sm:self-auto"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4">
            {/* Total Stats */}
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="font-semibold text-blue-800 text-base sm:text-lg">Vendor Analytics</h3>
                <button
                  onClick={() => {
                    console.log('Current vendor analytics:', vendorAnalytics);
                    console.log('All orders in system:', orders.length);
                    console.log('Filtered vendor orders:', orders.filter(o => {
                      if (!o.vendorId) return false;
                      const id = typeof o.vendorId === 'object' ? o.vendorId._id : o.vendorId;
                      return id === filterVendor;
                    }));
                    alert(`Debug Info:\nTotal Orders: ${vendorAnalytics.total.orders}\nTotal Amount: ₹${vendorAnalytics.total.amount}\nTotal Items: ${vendorAnalytics.total.items}\nCheck console for detailed logs.`);
                  }}
                  className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
                >
                  Debug
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">{vendorAnalytics.total.orders}</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">₹{vendorAnalytics.total.amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">{vendorAnalytics.total.items}</div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Order Status Breakdown</h3>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"></span>
                <span className="text-xs sm:text-sm">Pending: {vendorAnalytics.statusBreakdown.pending}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full"></span>
                <span className="text-xs sm:text-sm">Approved: {vendorAnalytics.statusBreakdown.approved}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></span>
                <span className="text-xs sm:text-sm">Fulfilled: {vendorAnalytics.statusBreakdown.fulfilled}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></span>
                <span className="text-xs sm:text-sm">Cancelled: {vendorAnalytics.statusBreakdown.cancelled}</span>
              </div>
            </div>
          </div>

          {/* Previous Orders */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">Previous Orders</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orders.filter(order => {
                if (!order.vendorId) return false;
                const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                return id === filterVendor;
              }).map((order) => (
                <div key={order._id} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        #{order._id?.slice(-8)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {getStatusBadge(order.status)}
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ₹{order.totalAmount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Items:</strong>
                    <div className="mt-1 space-y-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.name || 'Item'}</span>
                          <span>{item.quantity} × ₹{item.unitPrice?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {order.specialInstructions && (
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Notes:</strong> {order.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
              {orders.filter(order => {
                if (!order.vendorId) return false;
                const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                return id === filterVendor;
              }).length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No previous orders found for this vendor
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders List - Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">No orders found</td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {order.orderNumber || order._id?.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span>
                          {order.orderType === 'Kitchen to Pantry' ? 'Kitchen → Pantry' : 
                           order.orderType === 'Pantry to Kitchen' ? 'Pantry → Kitchen' :
                           order.orderType === 'Pantry to vendor' ? 'Pantry → Vendor' :
                           order.orderType || 'N/A'}
                        </span>
                        {order.orderType === 'Pantry to Kitchen' && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Auto-Delivered to Kitchen
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getVendorName(order.vendorId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="max-w-xs">
                        {(() => {
                          // For Kitchen to Pantry orders, show original request if items array is empty
                          const displayItems = order.items?.length > 0 ? order.items : 
                            (order.orderType === 'Kitchen to Pantry' && order.originalRequest?.items ? 
                              order.originalRequest.items.map(item => ({
                                ...item,
                                name: item.name || 'Unknown Item',
                                quantity: item.quantity || 0
                              })) : []);
                          return displayItems.length > 0 ? (
                          <div className="space-y-1">
                            {displayItems.slice(0, 2).map((item, idx) => {
                              let itemName = item.name || item.itemName;
                              
                              // Try to get from populated itemId first
                              if (!itemName && typeof item.itemId === 'object' && item.itemId?.name) {
                                itemName = item.itemId.name;
                              }
                              
                              // Try to find in current pantry items
                              if (!itemName && (item.itemId || item.pantryItemId)) {
                                const itemRef = item.itemId || item.pantryItemId;
                                const pantryItem = pantryItems.find(p => 
                                  p._id === itemRef || 
                                  p._id === (typeof itemRef === 'object' ? itemRef._id : itemRef)
                                );
                                itemName = pantryItem?.name;
                              }
                              
                              // Check if this is from original request (for Kitchen to Pantry orders)
                              if (!itemName && order.originalRequest?.items) {
                                const originalItem = order.originalRequest.items.find(orig => 
                                  (orig.itemId || orig.pantryItemId) === (item.itemId?._id || item.itemId || item.pantryItemId)
                                );
                                itemName = originalItem?.name;
                              }
                              // For Kitchen to Pantry orders, show original requested quantity if current is 0
                              const displayQuantity = order.orderType === 'Kitchen to Pantry' && (item.quantity === 0 || item.quantity === '0') ?
                                `${order.originalRequest?.items?.find(oi => (oi.itemId || oi.pantryItemId) === (item.itemId?._id || item.itemId))?.quantity || item.quantity} (Out of Stock)` :
                                item.quantity || 1;
                              
                              return (
                                <div key={idx} className="text-xs text-gray-700">
                                  {itemName || 'Unknown Item'} ({displayQuantity})
                                </div>
                              );
                            })}
                            {displayItems.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{displayItems.length - 2} more items
                              </div>
                            )}
                          </div>
                          ) : (
                            <span className="text-gray-400">No items</span>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(order.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.orderType === 'Pantry to vendor' ? (
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(order.paymentStatus)}
                          <button
                            onClick={() => {
                              const newStatus = order.paymentStatus === 'paid' ? 'pending' : 'paid';
                              updatePaymentStatus(order._id, {
                                paymentStatus: newStatus,
                                paidAmount: newStatus === 'paid' ? order.totalAmount : 0,
                                paymentMethod: 'UPI',
                                notes: `Payment ${newStatus} via admin panel`
                              });
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            {order.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={16} />
                        </button>
                        {localStorage.getItem('role') === 'admin' && (
                          <button
                            onClick={() => handleDeleteOrder(order._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'approved')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            {order.orderType === 'Kitchen to Pantry' ? 'Approve & Send to Kitchen' : 'Approve'}
                          </button>
                        )}
                        {order.status === 'approved' && order.orderType === 'Pantry to vendor' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'fulfilled')}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            Fulfill
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => handleFulfillOrder(order)}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            Fulfill
                          </button>
                        )}
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-gray-600 hover:text-gray-900 text-xs"
                        >
                          View
                        </button>
                        {order.orderType !== 'Pantry to Kitchen' && (
                          <>
                            <button
                              onClick={() => generateInvoice(order)}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              Invoice
                            </button>
                            <button
                              onClick={() => handleChalanUpload(order)}
                              className="text-purple-600 hover:text-purple-900 text-xs"
                            >
                              Chalan
                            </button>
                            {order.orderType === 'Pantry to vendor' && order.paymentStatus !== 'paid' && (() => {
                              const vendor = vendors.find(v => v._id === (typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId));
                              return vendor?.UpiID ? (
                                <button
                                  onClick={() => {
                                    setPaymentVendor({
                                      ...vendor,
                                      totalAmount: order.totalAmount || 0
                                    });
                                    setShowPaymentModal(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-900 text-xs"
                                >
                                  Pay Now
                                </button>
                              ) : null;
                            })()}
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders List - Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            Loading...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            No orders found
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {order.orderNumber || order._id?.slice(-8)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {order.orderType === 'Kitchen to Pantry' ? 'Kitchen → Pantry' : 
                     order.orderType === 'Pantry to Kitchen' ? 'Pantry → Kitchen' :
                     order.orderType === 'Pantry to vendor' ? 'Pantry → Vendor' :
                     order.orderType || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getPriorityBadge(order.priority)}
                  {getStatusBadge(order.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Vendor:</span>
                  <p className="font-medium">{getVendorName(order.vendorId)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Items:</span>
                  <div className="font-medium">
                    {(() => {
                      // For Kitchen to Pantry orders, show original request if items array is empty
                      const displayItems = order.items?.length > 0 ? order.items : 
                        (order.orderType === 'Kitchen to Pantry' && order.originalRequest?.items ? 
                          order.originalRequest.items.map(item => ({
                            ...item,
                            name: item.name || 'Unknown Item',
                            quantity: item.quantity || 0
                          })) : []);
                      return displayItems.length > 0 ? (
                        <div className="space-y-1">
                          {displayItems.slice(0, 2).map((item, idx) => {
                            let itemName = item.name || item.itemName;
                            
                            // Try to get from populated itemId first
                            if (!itemName && typeof item.itemId === 'object' && item.itemId?.name) {
                              itemName = item.itemId.name;
                            }
                            
                            // Try to find in current pantry items
                            if (!itemName && (item.itemId || item.pantryItemId)) {
                              const itemRef = item.itemId || item.pantryItemId;
                              const pantryItem = pantryItems.find(p => 
                                p._id === itemRef || 
                                p._id === (typeof itemRef === 'object' ? itemRef._id : itemRef)
                              );
                              itemName = pantryItem?.name;
                            }
                            
                            // Check if this is from original request (for Kitchen to Pantry orders)
                            if (!itemName && order.originalRequest?.items) {
                              const originalItem = order.originalRequest.items.find(orig => 
                                (orig.itemId || orig.pantryItemId) === (item.itemId?._id || item.itemId || item.pantryItemId)
                              );
                              itemName = originalItem?.name;
                            }
                            // For Kitchen to Pantry orders, show original requested quantity if current is 0
                            const displayQuantity = order.orderType === 'Kitchen to Pantry' && (item.quantity === 0 || item.quantity === '0') ?
                              `${order.originalRequest?.items?.find(oi => (oi.itemId || oi.pantryItemId) === (item.itemId?._id || item.itemId))?.quantity || item.quantity} (Out of Stock)` :
                              item.quantity || 1;
                            
                            return (
                              <div key={idx} className="text-sm">
                                {itemName || 'Unknown Item'} ({displayQuantity})
                              </div>
                            );
                          })}
                          {displayItems.length > 2 && (
                            <div className="text-sm text-gray-500">
                              +{displayItems.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No items</span>
                      );
                    })()}
                  </div>
                </div>
                {order.orderType === 'Pantry to vendor' && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Payment Status:</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentStatusBadge(order.paymentStatus)}
                      <button
                        onClick={() => {
                          const newStatus = order.paymentStatus === 'paid' ? 'pending' : 'paid';
                          updatePaymentStatus(order._id, {
                            paymentStatus: newStatus,
                            paidAmount: newStatus === 'paid' ? order.totalAmount : 0,
                            paymentMethod: 'UPI',
                            notes: `Payment ${newStatus} via mobile panel`
                          });
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {order.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEditOrder(order)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                >
                  <Edit size={14} />
                  Edit
                </button>
                {localStorage.getItem('role') === 'admin' && (
                  <button
                    onClick={() => handleDeleteOrder(order._id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'approved')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    {order.orderType === 'Kitchen to Pantry' ? 'Approve & Send to Kitchen' : 'Approve'}
                  </button>
                )}
                {order.status === 'approved' && order.orderType === 'Pantry to vendor' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'fulfilled')}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    Fulfill
                  </button>
                )}
                {order.status === 'delivered' && (
                  <button
                    onClick={() => handleFulfillOrder(order)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    Fulfill
                  </button>
                )}
                <button
                  onClick={() => handleViewOrder(order)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  View
                </button>
                {order.orderType !== 'Pantry to Kitchen' && (
                  <>
                    <button
                      onClick={() => generateInvoice(order)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      Invoice
                    </button>
                    <button
                      onClick={() => handleChalanUpload(order)}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                    >
                      Chalan
                    </button>
                    {order.orderType === 'Pantry to vendor' && order.paymentStatus !== 'paid' && (() => {
                      const vendorId = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                      const vendor = vendors.find(v => v._id === vendorId);
                      return vendor?.UpiID ? (
                        <button
                          onClick={() => {
                            setPaymentVendor({
                              ...vendor,
                              totalAmount: order.totalAmount || 0
                            });
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
                        >
                          Pay Now
                        </button>
                      ) : null;
                    })()}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>



      {/* Payment Modal */}
      {showPaymentModal && paymentVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border-t-4 border-primary">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#1f2937]">Payment Details</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-primary text-xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-[#1f2937] mb-2">{paymentVendor.name}</h3>
                <div className="text-2xl font-bold text-primary mb-4">₹{paymentVendor.totalAmount.toFixed(2)}</div>
                
                {paymentVendor.scannerImg && (
                  <div className="mb-4">
                    <img 
                      src={paymentVendor.scannerImg} 
                      alt="Payment QR Code" 
                      className="w-48 h-48 object-cover rounded-lg border-2 border-primary/20 mx-auto shadow-lg"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">UPI ID:</p>
                  <p className="font-mono text-sm bg-primary/5 text-primary p-3 rounded-lg border border-primary/20">{paymentVendor.UpiID}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const upiUrl = `upi://pay?pa=${paymentVendor.UpiID}&pn=${encodeURIComponent(paymentVendor.name)}&am=${paymentVendor.totalAmount}&cu=INR&tn=${encodeURIComponent('Payment for orders')}`;
                    
                    // Try to open UPI app
                    try {
                      window.location.href = upiUrl;
                      
                      // Fallback after 2 seconds if app doesn't open
                      setTimeout(() => {
                        const fallbackUrl = `https://pay.google.com/gp/p/ui/pay?pa=${paymentVendor.UpiID}&pn=${encodeURIComponent(paymentVendor.name)}&am=${paymentVendor.totalAmount}&cu=INR`;
                        window.open(fallbackUrl, '_blank');
                      }, 2000);
                    } catch (error) {
                      // If UPI fails, open Google Pay web
                      const fallbackUrl = `https://pay.google.com/gp/p/ui/pay?pa=${paymentVendor.UpiID}&pn=${encodeURIComponent(paymentVendor.name)}&am=${paymentVendor.totalAmount}&cu=INR`;
                      window.open(fallbackUrl, '_blank');
                    }
                  }}
                  className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-md"
                >
                  Pay via UPI
                </button>
                
                <button
                  onClick={async () => {
                    if (window.confirm(`Mark payment as completed via Cash?\n\nVendor: ${paymentVendor.name}\nAmount: ₹${paymentVendor.totalAmount.toFixed(2)}`)) {
                      try {
                        console.log('🔄 Starting cash payment process...');
                        console.log('Payment Vendor:', paymentVendor);
                        
                        // Find orders for this vendor and mark them as paid
                        const vendorId = filterVendor || paymentVendor._id;
                        console.log('🎯 Using vendor ID:', vendorId, 'filterVendor:', filterVendor);
                        
                        const vendorOrders = orders.filter(order => {
                          if (!order.vendorId) return false;
                          const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                          const matches = id === vendorId && order.paymentStatus !== 'paid';
                          console.log('🔍 Order check:', { orderId: order._id, orderVendorId: id, targetVendorId: vendorId, paymentStatus: order.paymentStatus, matches });
                          return matches;
                        });
                        
                        console.log(`📋 Found ${vendorOrders.length} unpaid orders for vendor:`, vendorOrders.map(o => ({ id: o._id, status: o.paymentStatus, amount: o.totalAmount })));
                        
                        // Update payment status for all unpaid orders
                        for (const order of vendorOrders) {
                          console.log(`💰 Updating payment for order ${order._id}...`);
                          await updatePaymentStatus(order._id, {
                            paymentStatus: 'paid',
                            paidAmount: order.totalAmount || 0,
                            paymentMethod: 'Cash',
                            notes: 'Payment completed via cash'
                          });
                          console.log(`✅ Payment updated for order ${order._id}`);
                        }
                        
                        console.log('🎉 All payments updated successfully');
                        showToast.success('Payment marked as completed via Cash');
                        setShowPaymentModal(false);
                        setPaymentVendor(null);
                      } catch (error) {
                        console.error('❌ Cash payment failed:', error);
                        showToast.error('Failed to update payment status');
                      }
                    }
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  Pay via Cash
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentVendor.UpiID).then(() => {
                      showToast.success('UPI ID copied to clipboard!');
                    }).catch(() => {
                      showToast.error('Failed to copy UPI ID');
                    });
                  }}
                  className="w-full bg-primary/10 text-primary py-2 px-4 rounded-lg hover:bg-primary/20 transition-colors border border-primary/30"
                >
                  Copy UPI ID
                </button>
                
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingOrder ? 'Edit Order' : 'Create New Order'}
              </h2>
              
              <form onSubmit={handleSubmitOrder} className="space-y-4">

                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                    <select
                      value={formData.orderType}
                      onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Order Type</option>
                      <option value="Kitchen to Pantry">Kitchen to Pantry</option>
                      <option value="Pantry to Kitchen">Pantry to Kitchen</option>
                      <option value="Pantry to vendor">Pantry to Vendor</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {(formData.orderType === 'Reception to Vendor' || formData.orderType === 'Daily Essentials Distributor' || formData.orderType === 'Pantry to vendor') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <select
                      value={formData.vendor}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                      onFocus={() => {
                        // Lazy load vendors when dropdown is opened
                        if (vendors.length === 0) {
                          fetchVendors();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Vendor ({vendors.length} available)</option>
                      {vendors.map(vendor => (
                        <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                      ))}
                    </select>
                    
                    {/* Vendor Analytics in Form */}
                    {formData.vendor && (() => {
                      const analytics = getVendorAnalytics(formData.vendor);
                      
                      return (
                        <div className="mt-3 bg-blue-50 p-3 rounded-lg border">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-blue-800 text-sm">📊 Vendor Analytics: {analytics.vendor?.name}</h4>
                            <button
                              type="button"
                              onClick={() => setShowFormAnalytics(!showFormAnalytics)}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded border border-blue-300 hover:bg-blue-100"
                            >
                              {showFormAnalytics ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          {showFormAnalytics && (
                            <>
                              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                                <div>
                                  <div className="text-lg font-bold text-blue-600">{analytics.total.orders}</div>
                                  <div className="text-gray-600">Orders</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-green-600">₹{analytics.total.amount}</div>
                                  <div className="text-gray-600">Amount</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-purple-600">{analytics.total.items}</div>
                                  <div className="text-gray-600">Items</div>
                                </div>
                              </div>
                              
                              {/* UPI and Scanner Info */}
                              {analytics.vendor?.UpiID && (
                                <div className="mt-3 p-2 bg-green-50 rounded border">
                                  <div className="text-xs text-gray-600 mb-1">Payment Info:</div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const totalAmount = analytics.total?.amount || 0;
                                      
                                      // Check if mobile device
                                      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                                      
                                      if (isMobile) {
                                        const upiUrl = `upi://pay?pa=${analytics.vendor.UpiID}&pn=${encodeURIComponent(analytics.vendor.name)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent('Payment for orders')}`;
                                        window.location.href = upiUrl;
                                      } else {
                                        // Desktop fallback: copy UPI ID to clipboard
                                        navigator.clipboard.writeText(analytics.vendor.UpiID).then(() => {
                                          alert(`UPI ID copied to clipboard: ${analytics.vendor.UpiID}\nAmount: ₹${totalAmount}\nOpen your UPI app and pay manually.`);
                                        }).catch(() => {
                                          alert(`UPI ID: ${analytics.vendor.UpiID}\nAmount: ₹${totalAmount}\nCopy this UPI ID and pay using your UPI app.`);
                                        });
                                      }
                                    }}
                                    className="text-sm font-mono text-green-700 hover:text-green-900 underline cursor-pointer bg-transparent border-none p-0"
                                  >
                                    {analytics.vendor.UpiID}
                                  </button>
                                  {analytics.vendor.scannerImg && (
                                    <img 
                                      src={analytics.vendor.scannerImg} 
                                      alt="QR Code" 
                                      className="mt-2 w-20 h-20 border rounded shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => {
                                        const totalAmount = analytics.total?.amount || 0;
                                        
                                        // Check if mobile device
                                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                                        
                                        if (isMobile) {
                                          const upiUrl = `upi://pay?pa=${analytics.vendor.UpiID}&pn=${encodeURIComponent(analytics.vendor.name)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent('Payment for orders')}`;
                                          window.location.href = upiUrl;
                                        } else {
                                          // Desktop fallback: copy UPI ID to clipboard
                                          navigator.clipboard.writeText(analytics.vendor.UpiID).then(() => {
                                            alert(`UPI ID copied to clipboard: ${analytics.vendor.UpiID}\nAmount: ₹${totalAmount}\nOpen your UPI app and pay manually.`);
                                          }).catch(() => {
                                            alert(`UPI ID: ${analytics.vendor.UpiID}\nAmount: ₹${totalAmount}\nCopy this UPI ID and pay using your UPI app.`);
                                          });
                                        }
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                              
                              <div className="mt-2 flex justify-between text-xs">
                                <span className="text-yellow-600">Pending: {analytics.statusBreakdown.pending}</span>
                                <span className="text-green-600">Fulfilled: {analytics.statusBreakdown.fulfilled}</span>
                              </div>
                              
                              {/* Vendor Orders List */}
                              <div className="border-t border-blue-200 pt-2 mt-2">
                                <h5 className="font-medium text-blue-700 mb-2 text-xs">Recent Orders:</h5>
                                <div className="max-h-24 overflow-y-auto space-y-1">
                                  {orders.filter(order => {
                                    if (!order.vendorId) return false;
                                    const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                                    return id === formData.vendor;
                                  }).slice(0, 5).map((order, orderIdx) => (
                                    <div key={orderIdx} className="bg-white/70 p-2 rounded border">
                                      <div className="flex justify-between items-center text-xs font-medium text-gray-800 mb-1">
                                        <span>Order #{order._id?.slice(-6)} - {order.status}</span>
                                        <span className="text-green-600 font-bold">₹{order.totalAmount?.toFixed(0) || '0'}</span>
                                      </div>
                                      {(order.items || []).map((item, itemIdx) => {
                                        let itemName = item.name || item.itemName;
                                        if (!itemName && (item.itemId || item.pantryItemId)) {
                                          const pantryItem = pantryItems.find(p => p._id === (item.itemId || item.pantryItemId));
                                          itemName = pantryItem?.name;
                                        }
                                        return (
                                          <div key={itemIdx} className="flex justify-between text-xs text-gray-700 ml-2">
                                            <span>{itemName || 'Unknown Item'} x{item.quantity || 1}</span>
                                            <span className="text-green-600 font-medium">₹{((item.quantity || 1) * (item.unitPrice || 0)).toFixed(0)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                                  {orders.filter(order => {
                                    if (!order.vendorId) return false;
                                    const id = typeof order.vendorId === 'object' ? order.vendorId._id : order.vendorId;
                                    return id === formData.vendor;
                                  }).length === 0 && (
                                    <div className="text-center text-gray-500 py-2 text-xs">
                                      No recent orders found
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}



                {formData.orderType === 'Pantry to Reception' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                )}

                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                  </div>
                  
                  {pantryItems.length === 0 ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      No pantry items available. Please add pantry items first before creating orders.
                    </div>
                  ) : formData.selectedItems.length === 0 ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                        No items added yet. Click "Add Item" to add items to this order.
                      </div>
                      <button
                        type="button"
                        onClick={addItem}
                        disabled={pantryItems.length === 0}
                        className="w-full bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-2 rounded text-sm hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <Plus size={14} />
                        Add Item ({pantryItems.length} available)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.selectedItems.map((item, index) => (
                        <div key={index} className="p-3 border rounded space-y-3">
                          <div className="flex items-center space-x-3">
                            <select
                              value={item.pantryItemId || ''}
                              onChange={(e) => updateItem(index, 'pantryItemId', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              required
                            >
                              <option value="">Select Item</option>
                              {pantryItems.map(pantryItem => {
                                const stock = pantryItem.stockQuantity || 0;
                                const isOutOfStock = stock <= 0;
                                const canOrder = formData.orderType === 'Pantry to vendor' || formData.orderType === 'Kitchen to Pantry';
                                return (
                                  <option 
                                    key={pantryItem._id} 
                                    value={pantryItem._id}
                                    disabled={!canOrder && isOutOfStock}
                                  >
                                    {pantryItem.name} {isOutOfStock ? (canOrder ? '(Out of Stock - Auto Order)' : '(Out of Stock)') : `(Stock: ${stock})`}
                                  </option>
                                );
                              })}
                            </select>
                            
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={item.quantity}
                                max={(() => {
                                  if (formData.orderType === 'Pantry to vendor' || formData.orderType === 'Kitchen to Pantry') {
                                    return undefined; // No max limit for vendor orders and kitchen to pantry
                                  }
                                  const pantryItem = pantryItems.find(p => p._id === item.pantryItemId);
                                  return pantryItem?.stockQuantity || 0;
                                })()}
                                onChange={(e) => {
                                  if (formData.orderType === 'Pantry to vendor' || formData.orderType === 'Kitchen to Pantry') {
                                    // No stock validation for vendor orders and kitchen to pantry (auto vendor ordering)
                                    updateItem(index, 'quantity', e.target.value);
                                    return;
                                  }
                                  
                                  const pantryItem = pantryItems.find(p => p._id === item.pantryItemId);
                                  const maxStock = pantryItem?.stockQuantity || 0;
                                  const value = parseFloat(e.target.value);
                                  
                                  if (value > maxStock) {
                                    showToast.error(`Cannot order more than available stock (${maxStock})`);
                                    return;
                                  }
                                  updateItem(index, 'quantity', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Unit Price (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Total</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-medium">
                                ₹{(item.quantity * item.unitPrice).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Unit: {item.unit}
                          </div>

                        </div>
                      ))}
                      
                      {/* Add Item button that appears after all items */}
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={addItem}
                          disabled={pantryItems.length === 0}
                          className="w-full bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-2 rounded text-sm hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <Plus size={14} />
                          Add Item ({pantryItems.length} available)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Amount Display */}
                {formData.selectedItems.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">₹{formData.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Packaging and Labour Charges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Charge (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.packagingCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, packagingCharge: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Labour Charge (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.labourCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, labourCharge: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.selectedItems.length === 0}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <PantryInvoice 
          invoiceData={invoiceData}
          onClose={() => setShowInvoice(false)}
          vendors={vendors}
          pantryItems={pantryItems}
        />
      )}

      {/* View Order Modal */}
      {showViewModal && viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order ID:</span>
                      <p className="font-medium">#{viewingOrder.orderNumber || viewingOrder._id?.slice(-8)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Order Type:</span>
                      <p className="font-medium">
                        {viewingOrder.orderType === 'Kitchen to Pantry' ? 'Kitchen → Pantry' : 
                         viewingOrder.orderType === 'Pantry to Reception' ? 'Pantry → Reception' :
                         viewingOrder.orderType === 'Reception to Pantry' ? 'Reception → Pantry' :
                         viewingOrder.orderType === 'Reception to Vendor' ? 'Reception → Vendor' :
                         viewingOrder.orderType === 'store to vendor' ? 'Store → Vendor' :
                         viewingOrder.orderType === 'pantry to store' ? 'Pantry → Store' :
                         viewingOrder.orderType || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <div className="mt-1">{getPriorityBadge(viewingOrder.priority)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="mt-1">{getStatusBadge(viewingOrder.status)}</div>
                    </div>
                    {viewingOrder.vendorId && (
                      <div>
                        <span className="text-gray-500">Vendor:</span>
                        <p className="font-medium">{getVendorName(viewingOrder.vendorId)}</p>
                      </div>
                    )}
                    {viewingOrder.guestName && (
                      <div>
                        <span className="text-gray-500">Guest Name:</span>
                        <p className="font-medium">{viewingOrder.guestName}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Total Amount:</span>
                      <p className="font-medium text-green-600">₹{viewingOrder.totalAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                    {viewingOrder.orderType === 'Pantry to vendor' && (
                      <div>
                        <span className="text-gray-500">Payment Status:</span>
                        <div className="flex items-center gap-2 mt-1">
                          {getPaymentStatusBadge(viewingOrder.paymentStatus)}
                          <button
                            onClick={() => {
                              const newStatus = viewingOrder.paymentStatus === 'paid' ? 'pending' : 'paid';
                              updatePaymentStatus(viewingOrder._id, {
                                paymentStatus: newStatus,
                                paidAmount: newStatus === 'paid' ? viewingOrder.totalAmount : 0,
                                paymentMethod: 'UPI',
                                notes: `Payment ${newStatus} via order view modal`
                              });
                              setShowViewModal(false);
                            }}
                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            {viewingOrder.paymentStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          </button>
                        </div>
                        {viewingOrder.paymentDetails?.paidAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Paid on: {new Date(viewingOrder.paymentDetails.paidAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info (if vendor selected) */}
                {viewingOrder.vendorId && (() => {
                  const vendorId = typeof viewingOrder.vendorId === 'object' ? viewingOrder.vendorId._id : viewingOrder.vendorId;
                  const vendor = vendors.find(v => v._id === vendorId);
                  
                  return vendor?.UpiID ? (
                    <div className="bg-green-50 p-4 rounded-lg border">
                      <h3 className="font-semibold text-green-800 mb-3">Payment Info</h3>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">UPI ID:</div>
                          <span className="font-mono text-green-700">{vendor.UpiID}</span>
                        </div>
                        {vendor.scannerImg && (
                          <img 
                            src={vendor.scannerImg} 
                            alt="QR Code" 
                            className="w-16 h-16 border rounded shadow-sm"
                          />
                        )}
                      </div>
                      <div className="mb-3">
                        <div className="text-sm text-gray-600">Order Amount:</div>
                        <div className="text-lg font-bold text-green-600">₹{viewingOrder.totalAmount?.toFixed(2) || '0.00'}</div>
                      </div>
                      <button
                        onClick={() => {
                          setPaymentVendor({
                            ...vendor,
                            totalAmount: viewingOrder.totalAmount || 0
                          });
                          setShowViewModal(false);
                          setShowPaymentModal(true);
                        }}
                        className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                      >
                        Pay Now
                      </button>
                    </div>
                  ) : null;
                })()}

                {/* Items */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Items ({viewingOrder.items?.length || 0})</h3>
                  <div className="space-y-3">
                    {viewingOrder.items?.map((item, index) => {
                      // Get item name from multiple possible sources
                      let itemName = item.name || item.itemName;
                      
                      // Try to get from populated itemId first
                      if (!itemName && typeof item.itemId === 'object' && item.itemId?.name) {
                        itemName = item.itemId.name;
                      }
                      
                      // Try to find in current pantry items
                      if (!itemName && (item.itemId || item.pantryItemId)) {
                        const itemRef = item.itemId || item.pantryItemId;
                        const pantryItem = pantryItems.find(p => 
                          p._id === itemRef || 
                          p._id === (typeof itemRef === 'object' ? itemRef._id : itemRef)
                        );
                        itemName = pantryItem?.name;
                      }
                      
                      // Check if this is from original request (for Kitchen to Pantry orders)
                      if (!itemName && viewingOrder.originalRequest?.items) {
                        const originalItem = viewingOrder.originalRequest.items.find(orig => 
                          (orig.itemId || orig.pantryItemId) === (item.itemId?._id || item.itemId || item.pantryItemId)
                        );
                        itemName = originalItem?.name;
                      }
                      
                      return (
                        <div key={index} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{itemName || 'Unknown Item'}</h4>
                              <p className="text-sm text-gray-500">Unit: {item.unit || 'pcs'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₹{((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</p>
                              <p className="text-sm text-gray-500">{item.quantity || 1} × ₹{item.unitPrice?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-2">Notes: {item.notes}</p>
                          )}
                        </div>
                      );
                    }) || (
                      <div className="text-center text-gray-500 py-4">
                        No items in this order
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{viewingOrder.notes || 'No notes added'}</p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Timestamps</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2">{new Date(viewingOrder.createdAt).toLocaleString()}</span>
                    </div>
                    {viewingOrder.updatedAt && (
                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <span className="ml-2">{new Date(viewingOrder.updatedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fulfillment Modal */}
      {showFulfillmentModal && fulfillmentOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Fulfill Order</h2>
                <button
                  onClick={() => setShowFulfillmentModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
                  <p className="text-sm text-gray-600">Order ID: #{fulfillmentOrder._id?.slice(-8)}</p>
                  <p className="text-sm text-gray-600">Vendor: {getVendorName(fulfillmentOrder.vendorId)}</p>
                  <p className="text-sm text-gray-600">Items: {fulfillmentOrder.items?.length || 0}</p>
                  {fulfillmentOrder.chalanImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Chalan:</p>
                      <img 
                        src={fulfillmentOrder.chalanImage} 
                        alt="Chalan" 
                        className="w-20 h-20 object-cover rounded border cursor-pointer"
                        onClick={() => window.open(fulfillmentOrder.chalanImage, '_blank')}
                      />
                    </div>
                  )}
                  {fulfillmentOrder.fulfillment?.chalanImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Fulfillment Chalan:</p>
                      <img 
                        src={fulfillmentOrder.fulfillment.chalanImage} 
                        alt="Fulfillment Chalan" 
                        className="w-20 h-20 object-cover rounded border cursor-pointer"
                        onClick={() => window.open(fulfillmentOrder.fulfillment.chalanImage, '_blank')}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fulfillmentData.previousAmount}
                    onChange={(e) => setFulfillmentData(prev => ({ 
                      ...prev, 
                      previousAmount: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fulfillmentData.newAmount}
                    onChange={(e) => setFulfillmentData(prev => ({ 
                      ...prev, 
                      newAmount: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difference</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-medium">
                    ₹{(fulfillmentData.newAmount - fulfillmentData.previousAmount).toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFulfillmentData(prev => ({ 
                      ...prev, 
                      pricingImage: e.target.files[0] 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={fulfillmentData.notes}
                    onChange={(e) => setFulfillmentData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Add fulfillment notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowFulfillmentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFulfillment}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Fulfilling...' : 'Fulfill Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto Vendor Notification */}
      {showAutoVendorNotification && (
        <AutoVendorNotification
          outOfStockItems={autoVendorData.outOfStockItems}
          autoVendorOrder={autoVendorData.autoVendorOrder}
          onClose={() => setShowAutoVendorNotification(false)}
          onViewVendorOrder={(vendorOrder) => {
            // Filter to show the auto-created vendor order
            setFilterType('Pantry to vendor');
            setFilterVendor(vendorOrder.vendorId?._id || vendorOrder.vendorId);
            setShowAutoVendorNotification(false);
            showToast.info('Filtered to show auto-created vendor order');
          }}
        />
      )}

      {/* Chalan Upload Modal */}
      {showChalanModal && chalanOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Upload Chalan</h2>
                <button
                  onClick={() => setShowChalanModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
                  <p className="text-sm text-gray-600">Order ID: #{chalanOrder._id?.slice(-8)}</p>
                  <p className="text-sm text-gray-600">Vendor: {getVendorName(chalanOrder.vendorId)}</p>
                  <p className="text-sm text-gray-600">Amount: ₹{chalanOrder.totalAmount || 0}</p>
                </div>

                {chalanOrder?.chalanImage && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Current Chalan:</p>
                    <img 
                      src={chalanOrder.chalanImage} 
                      alt="Current chalan" 
                      className="w-full h-32 object-cover rounded border cursor-pointer"
                      onClick={() => window.open(chalanOrder.chalanImage, '_blank')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Chalan Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setChalanFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {chalanFile && (
                    <p className="text-sm text-green-600 mt-1">Selected: {chalanFile.name}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChalanModal(false);
                    setChalanFile(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitChalan}
                  disabled={loading || !chalanFile}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Upload Chalan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;

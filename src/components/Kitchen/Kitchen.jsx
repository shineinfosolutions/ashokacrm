import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import { Plus, Edit, Trash2, Package, Clock, CheckCircle } from 'lucide-react';

const Kitchen = () => {
  const { axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    items: [{ itemId: '', quantity: '1', unitPrice: 0 }],
    totalAmount: 0,
    orderType: 'kitchen_to_pantry',
    specialInstructions: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (refreshOnly = false) => {
    setLoading(true);
    try {
      // Only fetch items and vendors on initial load, not on refresh
      if (!refreshOnly) {
        // Fetch items
        try {
          const itemsRes = await axios.get('/api/pantry/items', { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
          });
          const itemsData = itemsRes.data;
          setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.items || itemsData?.data || []));
        } catch (error) {
          console.log('Items fetch failed:', error);
          setItems([]);
        }

        // Fetch vendors
        try {
          const vendorsRes = await axios.get('/api/vendor/all', { 
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
          });
          const vendorsData = vendorsRes.data;
          setVendors(Array.isArray(vendorsData) ? vendorsData : (vendorsData?.vendors || vendorsData?.data || []));
        } catch (error) {
          console.log('Vendors fetch failed:', error);
          setVendors([]);
        }



        // Auto-sync missing kitchen orders first (only on initial load)
        try {
          await axios.post('/api/kitchen/sync', {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log('✅ Auto-sync completed');
        } catch (error) {
          console.log('Auto-sync failed (may not be available on server):', error.response?.status);
        }
      }

      // Always fetch kitchen orders (fast query with pagination)
      try {
        const kitchenOrdersRes = await axios.get('/api/kitchen?legacy=true&limit=20', { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        
        const kitchenOrders = kitchenOrdersRes.data || [];
        setOrders(Array.isArray(kitchenOrders) ? kitchenOrders : []);
      } catch (error) {
        console.log('Orders fetch failed:', error);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = formData.items.filter(item => item.itemId && item.quantity > 0);
    if (validItems.length === 0) {
      showToast.error('Please add at least one valid item');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: validItems
      };
      
      if (editingOrder) {
        await axios.put(`/api/kitchen/${editingOrder._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showToast.success('Order updated successfully');
      } else {
        await axios.post('/api/kitchen', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showToast.success('Order created successfully');
      }
      resetForm();
      fetchData();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await axios.delete(`/api/kitchen/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast.success('Order deleted successfully');
      fetchData();
    } catch (error) {
      showToast.error('Failed to delete order');
    }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    try {
      // Update kitchen order status (will sync pantry if linked)
      await axios.put(`/api/kitchen/${order._id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      showToast.success(`Order ${newStatus} successfully`);
      fetchData();
    } catch (error) {
      showToast.error('Failed to update order status');
      console.error('Status update error:', error);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      items: order.items || [{ itemId: '', quantity: '1', unitPrice: 0 }],
      totalAmount: order.totalAmount,
      orderType: order.orderType,
      specialInstructions: order.specialInstructions || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      items: [{ itemId: '', quantity: '1', unitPrice: 0 }],
      totalAmount: 0,
      orderType: 'kitchen_to_pantry',
      specialInstructions: ''
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-purple-100 text-purple-800',
      fulfilled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: '', quantity: '1', unitPrice: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        // Auto-set unit price from selected item
        if (field === 'itemId') {
          const selectedItem = items.find(itm => itm._id === value);
          if (selectedItem) {
            updatedItem.unitPrice = selectedItem.costPerUnit || selectedItem.price || 10;
          }
        }
        return updatedItem;
      }
      return item;
    });
    const total = updatedItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    setFormData({ ...formData, items: updatedItems, totalAmount: total });
  };



  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-text">Kitchen Orders</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Total Orders: {orders.length} | 
            Pending: {orders.filter(o => o.status === 'pending').length} | 
            Delivered: {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchData(true)}
            className="bg-secondary text-text px-4 py-2 rounded-lg hover:bg-hover flex items-center gap-2 shadow-lg transition-all duration-200"
            disabled={loading}
          >
            <Package size={20} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-text px-4 py-2 rounded-lg hover:bg-hover flex items-center gap-2 shadow-lg transition-all duration-200"
          >
            <Plus size={20} />
            New Order
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-xl border border-border">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-text">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-text">
                      No orders found. Create your first order.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-background transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {order._id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{order.orderType.replace('_', ' ')}</span>
                          {order.pantryOrderId && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              From Pantry
                            </span>
                          )}
                          {order.orderType === 'kitchen_to_pantry' && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              To Pantry
                            </span>
                          )}
                        </div>
                        {order.specialInstructions && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {order.specialInstructions}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        <div className="flex items-center gap-1">
                          <Package size={14} />
                          <div className="max-w-xs">
                            {order.items?.length > 0 ? (
                              <div className="text-xs">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="truncate">
                                    {item.itemId?.name || item.name || 'Unknown Item'} ({item.quantity})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              '0 items'
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(order, 'approved')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                            >
                              Approve
                            </button>
                          )}
                          {(order.status === 'approved' || (order.status === 'pending' && order.orderType === 'kitchen_to_pantry')) && (
                            <button
                              onClick={() => handleStatusUpdate(order, 'delivered')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                            >
                              Mark Received
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleStatusUpdate(order, 'ready')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => handleStatusUpdate(order, 'delivered')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                            >
                              Mark Received
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(order)}
                            className="text-primary hover:text-hover"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(order._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-background rounded-t-lg">
              <h2 className="text-xl font-bold mb-4 text-text">
                {editingOrder ? 'Edit Order' : 'Create New Order'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Order Type</label>
                  <input
                    type="text"
                    value="Kitchen to Pantry"
                    readOnly
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-text">Items</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-primary hover:text-hover text-sm font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                      <select
                        value={item.itemId}
                        onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                        className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      >
                        <option value="">Select Item</option>
                        {Array.isArray(items) && items.map(itm => (
                          <option key={itm._id} value={itm._id}>{itm.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="Quantity"
                        className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        required
                      />
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value) || 0)}
                        placeholder="Unit Price"
                        className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        step="0.01"
                        required
                      />
                      <div className="px-3 py-2 bg-background border border-border rounded-md text-sm font-medium">
                        ₹{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Total Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    readOnly
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Special Instructions</label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-border rounded-md text-text hover:bg-background transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-text rounded-md hover:bg-hover disabled:opacity-50 transition-all duration-200"
                  >
                    {loading ? 'Saving...' : editingOrder ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kitchen;

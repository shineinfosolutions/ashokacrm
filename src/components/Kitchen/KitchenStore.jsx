import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import { Plus, Package, Edit, Trash2, Minus, ShoppingCart } from 'lucide-react';

const KitchenStore = () => {
  const { axios } = useAppContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    category: ''
  });
  const [showTakeOut, setShowTakeOut] = useState(false);
  const [takeOutData, setTakeOutData] = useState({
    items: [{ itemName: '', quantity: 1, unit: '', purpose: 'cooking' }],
    notes: ''
  });
  const [searchTerms, setSearchTerms] = useState(['']);
  const [showDropdowns, setShowDropdowns] = useState([false]);

  useEffect(() => {
    fetchItems();
    
    // Auto-refresh every 30 seconds to show updated inventory
    const interval = setInterval(() => {
      fetchItems();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/kitchen-store/items', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const itemsData = response.data;
      setItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (error) {
      console.log('Items fetch failed:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await axios.put(`/api/kitchen-store/items/${editingItem._id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showToast.success('Item updated successfully');
      } else {
        await axios.post('/api/kitchen-store/items', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showToast.success('Item added successfully');
      }
      resetForm();
      fetchItems();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity || 0,
      unit: item.unit,
      category: item.category
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`/api/kitchen-store/items/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast.success('Item deleted successfully');
      fetchItems();
    } catch (error) {
      showToast.error('Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      quantity: '', 
      unit: '', 
      category: ''
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleTakeOut = async (e) => {
    e.preventDefault();
    const validItems = takeOutData.items.filter(item => item.itemName && item.quantity > 0);
    if (validItems.length === 0) {
      showToast.error('Please add at least one valid item');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/kitchen-store/take-out', {
        items: validItems,
        notes: takeOutData.notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      showToast.success('Items taken out successfully');
      resetTakeOutForm();
      fetchItems();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to take out items');
    } finally {
      setLoading(false);
    }
  };

  const resetTakeOutForm = () => {
    setTakeOutData({
      items: [{ itemName: '', quantity: 1, unit: '', purpose: 'cooking' }],
      notes: ''
    });
    setSearchTerms(['']);
    setShowDropdowns([false]);
    setShowTakeOut(false);
  };

  const createOrder = async (itemId) => {
    try {
      await axios.post(`/api/kitchen-store/order/${itemId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast.success('Order created successfully');
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to create order');
    }
  };

  const addTakeOutItem = () => {
    setTakeOutData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 1, unit: '', purpose: 'cooking' }]
    }));
    setSearchTerms(prev => [...prev, '']);
    setShowDropdowns(prev => [...prev, false]);
  };

  const removeTakeOutItem = (index) => {
    setTakeOutData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setSearchTerms(prev => prev.filter((_, i) => i !== index));
    setShowDropdowns(prev => prev.filter((_, i) => i !== index));
  };

  const updateTakeOutItem = (index, field, value) => {
    setTakeOutData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      if (field === 'itemName') {
        const item = items.find(i => i.name === value);
        if (item) {
          updatedItems[index].unit = item.unit || '';
        }
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">Kitchen Store Inventory</h1>
        <div className="flex gap-2">
          {/* <button
            onClick={fetchItems}
            className="bg-secondary text-text px-4 py-2 rounded-lg hover:bg-hover flex items-center gap-2 shadow-lg transition-all duration-200"
          >
            <Package size={20} />
            Refresh
          </button> */}
          <button
            onClick={() => setShowTakeOut(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 shadow-lg transition-all duration-200"
          >
            <Minus size={20} />
            Take Out
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-text px-4 py-2 rounded-lg hover:bg-hover flex items-center gap-2 shadow-lg transition-all duration-200"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-xl border border-border">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-text">Loading items...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-text">
                      No items found. Add your first item.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-background transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        <span className={`font-medium ${
                          (item.quantity || 0) <= 0 ? 'text-red-600' : 
                          (item.quantity || 0) <= 5 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {(item.quantity || 0) <= 0 && (
                            <button
                              onClick={() => createOrder(item._id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Create order for this item"
                            >
                              <ShoppingCart size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary hover:text-hover"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
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
          <div className="bg-white rounded-lg shadow-2xl border border-border w-full max-w-md">
            <div className="p-6 bg-background rounded-t-lg">
              <h2 className="text-xl font-bold mb-4 text-text">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Item Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="kg, pcs, liters, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Vegetables, Spices, etc."
                    required
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
                    {loading ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Take Out Modal */}
      {showTakeOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Take Out Items</h2>
              
              <form onSubmit={handleTakeOut} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button
                      type="button"
                      onClick={addTakeOutItem}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  
                  {takeOutData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2 p-3 border rounded">
                      <div className="relative sm:col-span-2">
                        <input
                          type="text"
                          value={searchTerms[index] || item.itemName || ''}
                          onChange={(e) => {
                            const newSearchTerms = [...searchTerms];
                            newSearchTerms[index] = e.target.value;
                            setSearchTerms(newSearchTerms);
                            const newShowDropdowns = [...showDropdowns];
                            newShowDropdowns[index] = true;
                            setShowDropdowns(newShowDropdowns);
                          }}
                          onFocus={() => {
                            const newShowDropdowns = [...showDropdowns];
                            newShowDropdowns[index] = true;
                            setShowDropdowns(newShowDropdowns);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              const newShowDropdowns = [...showDropdowns];
                              newShowDropdowns[index] = false;
                              setShowDropdowns(newShowDropdowns);
                            }, 200);
                          }}
                          placeholder="Search items..."
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                        {showDropdowns[index] && (
                          <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                            {items
                              .filter(storeItem => 
                                storeItem.name.toLowerCase().includes((searchTerms[index] || '').toLowerCase())
                              )
                              .map(storeItem => (
                                <div
                                  key={storeItem._id}
                                  onClick={() => {
                                    updateTakeOutItem(index, 'itemName', storeItem.name);
                                    const newSearchTerms = [...searchTerms];
                                    newSearchTerms[index] = storeItem.name;
                                    setSearchTerms(newSearchTerms);
                                    const newShowDropdowns = [...showDropdowns];
                                    newShowDropdowns[index] = false;
                                    setShowDropdowns(newShowDropdowns);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
                                >
                                  {storeItem.name} (Available: {storeItem.quantity})
                                </div>
                              ))
                            }
                            {items.filter(storeItem => 
                              storeItem.name.toLowerCase().includes((searchTerms[index] || '').toLowerCase())
                            ).length === 0 && (
                              <div className="px-3 py-2 text-gray-500 text-sm">
                                No items found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => updateTakeOutItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Quantity"
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                      
                      <select
                        value={item.purpose}
                        onChange={(e) => updateTakeOutItem(index, 'purpose', e.target.value)}
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="cooking">Cooking</option>
                        <option value="preparation">Preparation</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="other">Other</option>
                      </select>
                      
                      <button
                        type="button"
                        onClick={() => removeTakeOutItem(index)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={takeOutData.notes}
                    onChange={(e) => setTakeOutData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetTakeOutForm}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loading ? 'Taking Out...' : 'Take Out Items'}
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

export default KitchenStore;

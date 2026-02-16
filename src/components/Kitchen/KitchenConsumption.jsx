import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import { Plus, Trash2, Package, Clock, User, Eye, X, Filter, Calendar } from 'lucide-react';

const KitchenConsumption = () => {
  const { axios } = useAppContext();
  const [consumptions, setConsumptions] = useState([]);
  const [kitchenStore, setKitchenStore] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    items: [{ itemName: '', quantity: 1, unit: 'pcs', purpose: 'cooking' }],
    notes: ''
  });
  const [searchTerms, setSearchTerms] = useState(['']);
  const [showDropdowns, setShowDropdowns] = useState([false]);
  const [selectedConsumption, setSelectedConsumption] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/api/kitchen-consumption?page=${page}&limit=10`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;
      
      const [consumptionsRes, storeRes] = await Promise.all([
        axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/kitchen-store/items', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setConsumptions(consumptionsRes.data.consumptions || []);
      setPagination(consumptionsRes.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      setKitchenStore(storeRes.data.items || []);
    } catch (error) {
      console.error('Fetch error:', error);
      showToast.error(error.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = formData.items.filter(item => item.itemName && item.quantity > 0);
    if (validItems.length === 0) {
      showToast.error('Please add at least one valid item');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/kitchen-consumption', {
        items: validItems,
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      showToast.success('Consumption recorded successfully');
      resetForm();
      fetchData();
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Failed to record consumption');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 1, unit: 'pcs', purpose: 'cooking' }]
    }));
    setSearchTerms(prev => [...prev, '']);
    setShowDropdowns(prev => [...prev, false]);
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setSearchTerms(prev => prev.filter((_, i) => i !== index));
    setShowDropdowns(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Auto-set unit when item is selected
      if (field === 'itemName') {
        const storeItem = kitchenStore.find(item => item.name === value);
        if (storeItem) {
          updatedItems[index].unit = storeItem.unit || 'pcs';
        }
      }
      
      return { ...prev, items: updatedItems };
    });
  };

  const resetForm = () => {
    setFormData({
      items: [{ itemName: '', quantity: 1, unit: 'pcs', purpose: 'cooking' }],
      notes: ''
    });
    setSearchTerms(['']);
    setShowDropdowns([false]);
    setShowForm(false);
  };

  const deleteConsumption = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consumption record?')) return;
    
    try {
      await axios.delete(`/api/kitchen-consumption/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showToast.success('Consumption record deleted');
      fetchData();
    } catch (error) {
      showToast.error('Failed to delete consumption record');
    }
  };

  const viewDetails = (consumption) => {
    setSelectedConsumption(consumption);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedConsumption(null);
    setShowDetailsModal(false);
  };

  const applyFilters = () => {
    fetchData(1);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '' });
    setTimeout(() => fetchData(1), 0);
  };

  return (
    <div className="p-4 sm:p-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">Kitchen Consumption</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track items taken from kitchen store
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-secondary text-text px-4 py-2 rounded-lg hover:bg-hover transition-colors flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-secondary text-text px-4 py-2 rounded-lg hover:bg-hover transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus size={20} />
            Record Consumption
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 flex items-center gap-2"
              >
                <Calendar size={16} />
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consumption Records */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumed By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consumptions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No consumption records found
                      </td>
                    </tr>
                  ) : (
                    consumptions.map((consumption) => (
                      <tr key={consumption._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(consumption.consumptionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="max-w-xs">
                            {consumption.items.map((item, idx) => (
                              <div key={idx} className="text-xs">
                                {item.itemName} ({item.quantity} {item.unit}) - {item.purpose}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {consumption.totalItems}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {consumption.consumedBy?.username || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewDetails(consumption)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => deleteConsumption(consumption._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
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
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 p-4 border-t">
                <button
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {consumptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No consumption records found
                </div>
              ) : (
                consumptions.map((consumption) => (
                  <div key={consumption._id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={14} />
                          {new Date(consumption.consumptionDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <User size={14} />
                          {consumption.consumedBy?.username || 'Unknown'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDetails(consumption)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteConsumption(consumption._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Items ({consumption.totalItems} total):
                      </div>
                      {consumption.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600 ml-2">
                          • {item.itemName} ({item.quantity} {item.unit}) - {item.purpose}
                        </div>
                      ))}
                    </div>
                    
                    {consumption.notes && (
                      <div className="text-sm text-gray-600">
                        <strong>Notes:</strong> {consumption.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Mobile Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 p-4">
                <button
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Record Kitchen Consumption</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-2 p-3 border rounded">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerms[index] || ''}
                          onChange={(e) => {
                            const newSearchTerms = [...searchTerms];
                            newSearchTerms[index] = e.target.value;
                            setSearchTerms(newSearchTerms);
                            const newShowDropdowns = [...showDropdowns];
                            newShowDropdowns[index] = e.target.value.length > 0;
                            setShowDropdowns(newShowDropdowns);
                          }}
                          onFocus={() => {
                            const newShowDropdowns = [...showDropdowns];
                            newShowDropdowns[index] = true;
                            setShowDropdowns(newShowDropdowns);
                          }}
                          placeholder="Search items..."
                          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                        {showDropdowns[index] && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                            {kitchenStore
                              .filter(storeItem => 
                                storeItem.name.toLowerCase().includes((searchTerms[index] || '').toLowerCase())
                              )
                              .map(storeItem => (
                                <div
                                  key={storeItem._id}
                                  onClick={() => {
                                    updateItem(index, 'itemName', storeItem.name);
                                    const newSearchTerms = [...searchTerms];
                                    newSearchTerms[index] = storeItem.name;
                                    setSearchTerms(newSearchTerms);
                                    const newShowDropdowns = [...showDropdowns];
                                    newShowDropdowns[index] = false;
                                    setShowDropdowns(newShowDropdowns);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                  {storeItem.name} (Available: {storeItem.quantity})
                                </div>
                              ))
                            }
                            {kitchenStore.filter(storeItem => 
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
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Quantity"
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                      
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="Unit"
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      
                      <select
                        value={item.purpose}
                        onChange={(e) => updateItem(index, 'purpose', e.target.value)}
                        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="cooking">Cooking</option>
                        <option value="preparation">Preparation</option>
                        <option value="cleaning">Cleaning</option>
                        <option value="other">Other</option>
                      </select>
                      
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
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
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'Recording...' : 'Record Consumption'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedConsumption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Consumption Details</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consumption Date</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedConsumption.consumptionDate).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consumed By</label>
                    <div className="text-sm text-gray-900">
                      {selectedConsumption.consumedBy?.username || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Items</label>
                    <div className="text-sm text-gray-900 font-medium">
                      {selectedConsumption.totalItems}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedConsumption.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Items Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items Consumed</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedConsumption.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-600">Purpose: {item.purpose}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{item.quantity} {item.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedConsumption.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900">
                      {selectedConsumption.notes}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timestamps</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <div className="text-gray-600">
                        {new Date(selectedConsumption.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <div className="text-gray-600">
                        {new Date(selectedConsumption.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenConsumption;
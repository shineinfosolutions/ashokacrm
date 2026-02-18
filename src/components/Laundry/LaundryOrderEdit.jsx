import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UpdateButton } from '../common/SubmitButton';

const LaundryOrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [laundryItems, setLaundryItems] = useState([]);
  const [formData, setFormData] = useState({
    grcNo: '',
    roomNumber: '',
    requestedByName: '',
    laundryStatus: 'pending',
    serviceType: 'wash',
    totalAmount: 0,
    items: []
  });

  useEffect(() => {
    fetchOrder();
    fetchLaundryItems();
  }, [id]);

  // Auto-calculate total when items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => {
      if (item.status !== 'cancelled' && item.status !== 'lost') {
        return sum + ((item.price || 0) * (item.quantity || 1));
      }
      return sum;
    }, 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.items]);

  const fetchLaundryItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/laundry-items/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLaundryItems(data.success ? data.laundryItems : []);
    } catch (error) {
      console.error('Failed to fetch laundry items');
    }
  };

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/laundry/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const order = data.order || data;
      
      // Extract prices from items
      const itemsWithPrices = (order.items || []).map(item => {
        let price = 0;
        if (item.rateId && typeof item.rateId === 'object' && item.rateId.rate) {
          price = item.rateId.rate;
        } else if (item.calculatedAmount && item.quantity) {
          price = item.calculatedAmount / item.quantity;
        } else if (item.price) {
          price = item.price;
        }
        
        return {
          ...item,
          price: price,
          itemName: item.itemName || (typeof item.rateId === 'object' ? item.rateId.itemName : ''),
          rateId: typeof item.rateId === 'object' ? item.rateId._id : item.rateId
        };
      });
      
      setFormData({
        grcNo: order.grcNo || '',
        roomNumber: order.roomNumber || '',
        requestedByName: order.requestedByName || '',
        laundryStatus: order.laundryStatus || 'pending',
        serviceType: order.serviceType || 'wash',
        totalAmount: order.totalAmount || 0,
        items: itemsWithPrices
      });
    } catch (error) {
      toast.error('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/laundry/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Order updated successfully');
        navigate('/laundry/orders');
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    
    // If changing to a new item from dropdown
    if (field === 'rateId') {
      const selectedItem = laundryItems.find(item => item._id === value);
      if (selectedItem) {
        updatedItems[index] = {
          ...updatedItems[index],
          rateId: selectedItem._id,
          itemName: selectedItem.itemName,
          price: selectedItem.rate || 0
        };
      }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value };
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 1, price: 0, rateId: '', status: 'pending' }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/laundry/orders')} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Edit size={24} />
          Edit Laundry Order
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">GRC No</label>
              <input
                type="text"
                name="grcNo"
                value={formData.grcNo}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Guest Name</label>
              <input
                type="text"
                name="requestedByName"
                value={formData.requestedByName}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="laundryStatus"
                value={formData.laundryStatus}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Service Type</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="wash">Wash</option>
                <option value="dry_clean">Dry Clean</option>
                <option value="iron">Iron</option>
                <option value="wash_iron">Wash & Iron</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Items</h3>
            <button
              type="button"
              onClick={addNewItem}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            {formData.items?.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded">
                <div className="col-span-4">
                  <select
                    value={item.rateId || ''}
                    onChange={(e) => handleItemChange(index, 'rateId', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="">Select Item</option>
                    {laundryItems.map((laundryItem) => (
                      <option key={laundryItem._id} value={laundryItem._id}>
                        {laundryItem.itemName} - ₹{laundryItem.rate}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={item.itemName || ''}
                    onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                    placeholder="Item name"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.quantity || 1}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    placeholder="Qty"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.price || 0}
                    placeholder="Price"
                    className="w-full p-2 border rounded text-sm bg-gray-100"
                    readOnly
                  />
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full p-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <UpdateButton 
            onSubmit={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={16} />
            Update Order
          </UpdateButton>
          <button 
            onClick={() => navigate('/laundry/orders')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaundryOrderEdit;
import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';

const AddItemsModal = ({ isOpen, onClose, selectedOrder, onItemAdded }) => {
  const { axios } = useAppContext();
  const [items, setItems] = useState([]);
  const [addItemsForm, setAddItemsForm] = useState({ itemId: '', quantity: 1 });

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen]);

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

  const addItems = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const selectedItem = items.find(item => item._id === addItemsForm.itemId);
      if (!selectedItem) {
        showToast.error('Please select a valid item');
        return;
      }

      await axios.patch(`/api/restaurant-orders/${selectedOrder._id}/add-items`, {
        items: [{
          itemId: selectedItem._id,
          quantity: parseInt(addItemsForm.quantity) || 1
        }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast.success('Item added successfully!');
      setAddItemsForm({ itemId: '', quantity: 1 });
      onItemAdded();
      onClose();
    } catch (error) {
      console.error('Error adding items:', error);
      showToast.error('Failed to add items');
    }
  };

  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add Items to Order</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-100 rounded">
            <div className="font-semibold">Current Order Details:</div>
            <div className="text-sm mt-1">
              <div>Order ID: {selectedOrder._id?.slice(-6)}</div>
              <div>Table: {selectedOrder.tableNo}</div>
              <div>Items: {selectedOrder.allKotItems?.length || selectedOrder.items?.length || 0}</div>
              <div>Amount: ₹{selectedOrder.amount || 0}</div>
              <div>Status: {selectedOrder.status || 'pending'}</div>
            </div>
          </div>
          
          <form onSubmit={addItems} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Select Item to Add:</label>
              <select
                value={addItemsForm.itemId}
                onChange={(e) => setAddItemsForm({...addItemsForm, itemId: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                required
              >
                <option value="">Choose an item...</option>
                {items.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} - ₹{item.Price}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block font-semibold mb-2">Quantity:</label>
              <input
                type="number"
                min="1"
                value={addItemsForm.quantity}
                onChange={(e) => setAddItemsForm({...addItemsForm, quantity: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemsModal;
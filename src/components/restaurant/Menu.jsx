import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import Pagination from "../common/Pagination";

const Menu = () => {
  const { axios } = useAppContext();
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    Price: 0,
    category: '',
    Discount: 0,
    status: 'available',
    in_oostock: true,
    image: '',
    description: '',
    timeToPrepare: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/items/all');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingItem) {
        await axios.put(`/api/items/${editingItem._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/items/add', formData);
      }
      fetchMenuItems();
      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: '', Price: 0, category: '', Discount: 0, status: 'available', in_oostock: true, image: '', description: '', timeToPrepare: 0 });
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  return (
    <div className="p-4 sm:p-6" style={{ backgroundColor: 'hsl(45, 100%, 95%)', color: 'hsl(45, 100%, 20%)' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: 'hsl(45, 100%, 20%)' }}>Menu Items</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg w-full sm:w-auto"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
        >
          Add Item
        </button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-lg shadow-md mb-6" style={{ backgroundColor: 'white', border: '1px solid hsl(45, 100%, 85%)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(45, 100%, 20%)' }}>{editingItem ? 'Edit' : 'Add'} Menu Item</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Item Name *</label>
              <input
                type="text"
                placeholder="Enter item name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Price *</label>
              <input
                type="number"
                placeholder="Enter price"
                value={formData.Price}
                onChange={(e) => setFormData({...formData, Price: Math.max(0, Number(e.target.value))})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Category *</label>
              <input
                type="text"
                placeholder="Enter category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Discount</label>
              <input
                type="number"
                placeholder="Enter discount amount"
                value={formData.Discount}
                onChange={(e) => setFormData({...formData, Discount: Math.max(0, Number(e.target.value))})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Time to Prepare (minutes)</label>
              <input
                type="number"
                placeholder="Enter preparation time"
                value={formData.timeToPrepare}
                onChange={(e) => setFormData({...formData, timeToPrepare: Number(e.target.value)})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                min="0"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Description</label>
              <textarea
                placeholder="Enter item description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                rows="3"
              />
            </div>
            <div className="col-span-2 flex space-x-2">
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'hsl(45, 71%, 69%)', color: 'hsl(45, 100%, 20%)' }}
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({ name: '', Price: 0, category: '', Discount: 0, status: 'available', in_oostock: true, image: '', description: '', timeToPrepare: 0 });
                }}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'hsl(45, 32%, 46%)', color: 'white' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
          <div key={item._id} className="p-4 rounded-lg shadow-md" style={{ backgroundColor: 'white', border: '1px solid hsl(45, 100%, 85%)' }}>
            <h3 className="font-semibold text-lg" style={{ color: 'hsl(45, 100%, 20%)' }}>{item.name}</h3>
            <p className="text-sm mb-2" style={{ color: 'hsl(45, 100%, 30%)' }}>{item.description}</p>
            <p className="font-semibold" style={{ color: 'hsl(45, 43%, 58%)' }}>₹{item.Price}</p>
            {item.Discount > 0 && <p className="text-sm" style={{ color: 'hsl(120, 60%, 50%)' }}>Discount: ₹{item.Discount}</p>}
            <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>Category: {item.category}</p>
            {item.timeToPrepare > 0 && <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>Prep Time: {item.timeToPrepare} min</p>}
            <div className="flex justify-between items-center text-sm mb-2">
              <span className={`${item.in_oostock ? 'text-green-600' : 'text-red-600'}`}>
                {item.in_oostock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: 'hsl(45, 100%, 40%)' }}>Active:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.status === 'available'}
                  onChange={async (e) => {
                    try {
                      const token = localStorage.getItem('token');
                      await axios.put(`/api/items/${item._id}`, {
                        ...item,
                        status: e.target.checked ? 'available' : 'unavailable'
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      fetchMenuItems();
                    } catch (error) {
                      console.error('Error updating item status:', error);
                    }
                  }}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  item.status === 'available' ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    item.status === 'available' ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                onClick={() => handleEdit(item)}
                className="px-3 py-1 rounded text-sm flex-1"
                style={{ backgroundColor: 'hsl(45, 100%, 80%)', color: 'hsl(45, 100%, 20%)' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="px-3 py-1 rounded text-sm flex-1"
                style={{ backgroundColor: 'hsl(0, 70%, 60%)', color: 'white' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(menuItems.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={menuItems.length}
      />
    </div>
  );
};

export default Menu;

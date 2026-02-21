import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';

const AvailableTable = () => {
  const { axios } = useAppContext();
  const [tables, setTables] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTable, setEditingTable] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast.error('Please login again');
        return;
      }
      const response = await axios.get('/api/restaurant/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tablesData = Array.isArray(response.data) ? response.data : (response.data.tables || []);
      setTables(tablesData);
    } catch (error) {
      console.error('Error fetching tables:', error);
      if (error.response?.status === 401 || error.response?.data?.message === 'Invalid token') {
        localStorage.removeItem('token');
        showToast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    }
  };

  const searchTables = (query) => {
    if (!query.trim()) {
      fetchTables();
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showToast.error('Please login again');
      return;
    }
    axios.get('/api/restaurant/tables', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => {
      const tablesData = Array.isArray(response.data) ? response.data : (response.data.tables || []);
      const filteredTables = tablesData.filter(table => 
        table.tableNumber.toLowerCase().includes(query.toLowerCase()) ||
        table.location.toLowerCase().includes(query.toLowerCase())
      );
      setTables(filteredTables);
    }).catch(error => {
      console.error('Error searching tables:', error);
      if (error.response?.status === 401 || error.response?.data?.message === 'Invalid token') {
        localStorage.removeItem('token');
        showToast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    });
  };

  const updateTableStatus = async (tableId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast.error('Please login again');
        return;
      }
      await axios.put(`/api/restaurant/tables/${tableId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTables();
      showToast.success('✅ Table status updated successfully!');
    } catch (error) {
      console.error('Error updating table status:', error);
      if (error.response?.status === 401 || error.response?.data?.message === 'Invalid token') {
        localStorage.removeItem('token');
        showToast.error('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        showToast.error('Failed to update table status');
      }
    }
  };

  const deleteTable = async (tableId) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/restaurant/tables/delete/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTables();
      showToast.success('✅ Table deleted!');
    } catch (error) {
      showToast.error('Failed to delete table');
    }
  };

  const openEditModal = (table) => {
    setEditingTable({...table});
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        tableNumber: editingTable.tableNumber,
        capacity: Number(editingTable.capacity),
        location: editingTable.location
      };
      console.log('Updating table:', updateData);
      const response = await axios.put(`/api/restaurant/tables/${editingTable._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Update response:', response.data);
      setShowEditModal(false);
      fetchTables();
      showToast.success('✅ Table updated!');
    } catch (error) {
      console.error('Update error:', error);
      showToast.error('Failed to update table');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchTables(searchQuery);
  };

  return (
    <div className="p-4 sm:p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-text">Available Tables</h2>
        
        <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tables..."
              className="flex-1 p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="bg-primary text-text px-6 py-3 rounded-lg hover:bg-hover transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-text font-semibold text-sm sm:text-base">Table Number</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-text font-semibold text-sm sm:text-base">Capacity</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-text font-semibold text-sm sm:text-base">Location</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-text font-semibold text-sm sm:text-base">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-text font-semibold text-sm sm:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table, index) => (
                  <tr key={table._id} className={index % 2 === 0 ? 'bg-background' : 'bg-white'}>
                    <td className="px-3 sm:px-6 py-4 text-text font-medium text-sm sm:text-base">Table {table.tableNumber}</td>
                    <td className="px-3 sm:px-6 py-4 text-text text-sm sm:text-base">{table.capacity} guests</td>
                    <td className="px-3 sm:px-6 py-4 text-text capitalize text-sm sm:text-base">{table.location}</td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-green-100 text-green-800">
                        {table.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => openEditModal(table)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">Edit</button>
                        {userRole === 'ADMIN' && (
                          <button onClick={() => deleteTable(table._id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {tables.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No available tables found.
            </div>
          )}
        </div>
      </div>

      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-bold mb-4">Edit Table</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Table Number</label>
                <input type="text" value={editingTable.tableNumber} onChange={(e) => setEditingTable({...editingTable, tableNumber: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input type="number" value={editingTable.capacity} onChange={(e) => setEditingTable({...editingTable, capacity: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" value={editingTable.location} onChange={(e) => setEditingTable({...editingTable, location: e.target.value})} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableTable;

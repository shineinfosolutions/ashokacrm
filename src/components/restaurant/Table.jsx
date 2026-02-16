import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import AvailableTable from './Availabletable';
import Pagination from '../common/Pagination';
import { useSocket } from '../../context/SocketContext';
import { motion } from 'framer-motion';

// The main application component
const App = () => {
  const { axios } = useAppContext();
  const { socket } = useSocket();
  const [tables, setTables] = useState([]);
  const [activeTab, setActiveTab] = useState('manage');

  useEffect(() => {
    fetchTables();
    
    // 🔥 WebSocket listeners for table updates (fallback to polling)
    if (socket) {
      socket.on('table-status-updated', (data) => {
        setTables(prev => prev.map(table => 
          table._id === data.tableId 
            ? { ...table, status: data.status }
            : table
        ));
      });

      socket.on('table-created', (data) => {
        setTables(prev => [...prev, data.table]);
      });

      socket.on('table-updated', (data) => {
        setTables(prev => prev.map(table => 
          table._id === data.table._id 
            ? data.table
            : table
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('table-status-updated');
        socket.off('table-created');
        socket.off('table-updated');
      }
    };
  }, [socket]);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant/tables/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const getAllTableNumbers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant/tables/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.map(table => table.tableNumber);
    } catch (error) {
      console.error('Error fetching table numbers:', error);
      return [];
    }
  };

  // Use useState to manage the form input for a new table.
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    capacity: 1,
    location: 'restaurant',
    status: 'available',
    isActive: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Function to handle changes in the new table form inputs.
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTable(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Function to handle adding a new table to the list.
  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/restaurant/tables/create', newTable, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Table created successfully!');
      setNewTable({
        tableNumber: '',
        capacity: 1,
        location: 'restaurant',
        status: 'available',
        isActive: true,
      });
      fetchTables();
    } catch (error) {
      console.error('Error creating table:', error);
      alert('Failed to create table!');
    }
  };

  // Function to update the status of an existing table.
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/restaurant/tables/update/${id}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTables();
    } catch (error) {
      console.error('Error updating table status:', error);
      alert('Failed to update table status!');
    }
  };

  // Helper function to determine the color based on table status.
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-400';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-400';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-400';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background font-inter p-2 sm:p-4 md:p-8"
    >
      <div className="container mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text mb-6 text-center">Restaurant Table Dashboard</h1>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 sm:px-6 py-3 rounded-md font-medium transition-all duration-200 w-full sm:w-auto ${
                activeTab === 'manage'
                  ? 'bg-primary text-text shadow-md'
                  : 'text-gray-600 hover:text-text hover:bg-gray-100'
              }`}
            >
              Manage Tables
            </button>
            <button
              onClick={() => setActiveTab('available')}
              className={`px-3 sm:px-6 py-3 rounded-md font-medium transition-all duration-200 w-full sm:w-auto ${
                activeTab === 'available'
                  ? 'bg-primary text-text shadow-md'
                  : 'text-gray-600 hover:text-text hover:bg-gray-100'
              }`}
            >
              Available Tables
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'manage' && (
          <>
            {/* Form to add a new table */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-text mb-4">Add a New Table</h2>
          <form onSubmit={handleAddTable} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Table Number Input */}
            <div>
              <label htmlFor="tableNumber" className="block text-sm font-medium text-text">Table Number</label>
              <input
                type="text"
                name="tableNumber"
                id="tableNumber"
                value={newTable.tableNumber}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 transition duration-200 ease-in-out hover:border-hover"
              />
            </div>
            {/* Capacity Input */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-text">Capacity</label>
              <input
                type="number"
                name="capacity"
                id="capacity"
                value={newTable.capacity}
                onChange={handleInputChange}
                required
                min="1"
                max="4"
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 transition duration-200 ease-in-out hover:border-hover"
              />
            </div>
            {/* Location Dropdown */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-text">Location</label>
              <select
                name="location"
                id="location"
                value={newTable.location}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 transition duration-200 ease-in-out hover:border-hover"
              >
                <option value="restaurant">Restaurant</option>
                <option value="bar">Bar</option>
                <option value="terrace">Terrace</option>
                <option value="private_dining">Private Dining</option>
              </select>
            </div>
            {/* Status Dropdown */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-text">Initial Status</label>
              <select
                name="status"
                id="status"
                value={newTable.status}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 transition duration-200 ease-in-out hover:border-hover"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            {/* Is Active Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={newTable.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary rounded-md border-border focus:ring-primary"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-text">Is Active</label>
            </div>
            {/* Submit Button */}
            <div className="col-span-1 sm:col-span-2 md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-text bg-primary hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-200 ease-in-out"
              >
                Add Table
              </button>
            </div>
          </form>
        </div>

            {/* Grid to display tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {tables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((table, index) => (
                <motion.div
                  key={table._id || table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`bg-white p-4 sm:p-6 rounded-2xl shadow-lg border-b-4 ${getStatusColor(table.status)} transition duration-300 ease-in-out hover:shadow-xl`}
                >
                  <h3 className="text-xl font-bold mb-2">{`Table ${table.tableNumber}`}</h3>
                  <p className="text-sm text-gray-600">Capacity: <span className="font-semibold">{table.capacity}</span></p>
                  <p className="text-sm text-gray-600">Location: <span className="font-semibold capitalize">{table.location.replace('_', ' ')}</span></p>
                  <p className="text-sm text-gray-600">Status: <span className="font-semibold capitalize">{table.status}</span></p>
                  <p className="text-sm text-gray-600">Active: <span className="font-semibold">{table.isActive ? 'Yes' : 'No'}</span></p>

                  {/* Status Update Buttons */}
                  <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
                    {['available', 'occupied', 'reserved', 'maintenance'].map(statusOption => (
                      <button
                        key={statusOption}
                        onClick={() => handleStatusUpdate(table._id || table.id, statusOption)}
                        disabled={table.status === statusOption}
                        className={`
                          px-3 py-1 text-xs font-medium rounded-full
                          ${table.status === statusOption
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-primary text-text hover:bg-hover transition duration-150'
                          }
                        `}
                      >
                        Set to {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(tables.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={tables.length}
            />
          </>
        )}

        {/* Available Tables Tab */}
        {activeTab === 'available' && (
          <AvailableTable />
        )}
      </div>
    </motion.div>
  );
};

export default App;

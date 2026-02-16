import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';

const TransferTableModal = ({ isOpen, onClose, selectedOrder, onTransferComplete }) => {
  const { axios } = useAppContext();
  const [tables, setTables] = useState([]);
  const [transferForm, setTransferForm] = useState({ newTable: '', reason: 'Customer request', oldTableStatus: 'available' });

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

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

  const transferTable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/restaurant-orders/${selectedOrder._id}/transfer-table`, {
        newTableNo: transferForm.newTable,
        reason: transferForm.reason,
        oldTableStatus: transferForm.oldTableStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast.success('Table transferred successfully!');
      setTransferForm({ newTable: '', reason: 'Customer request', oldTableStatus: 'available' });
      onTransferComplete();
      onClose();
    } catch (error) {
      console.error('Error transferring table:', error);
      showToast.error('Failed to transfer table');
    }
  };

  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Transfer Table</h3>
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
              <div>Current Table: {selectedOrder.tableNo}</div>
              <div>Items: {selectedOrder.allKotItems?.length || selectedOrder.items?.length || 0}</div>
              <div>Amount: ₹{selectedOrder.amount || 0}</div>
              <div>Status: {selectedOrder.status || 'pending'}</div>
            </div>
          </div>
          
          <form onSubmit={transferTable} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Select New Table:</label>
              <select
                value={transferForm.newTable}
                onChange={(e) => setTransferForm({...transferForm, newTable: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none"
                required
              >
                <option value="">Choose a table...</option>
                {tables.filter(table => 
                  table.tableNumber !== selectedOrder.tableNo && 
                  (table.status === 'available' || !table.status)
                ).map(table => (
                  <option key={table._id} value={table.tableNumber}>
                    Table {table.tableNumber} ({table.status || 'available'})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block font-semibold mb-2">Set Old Table Status:</label>
              <select
                value={transferForm.oldTableStatus}
                onChange={(e) => setTransferForm({...transferForm, oldTableStatus: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none"
              >
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            
            <div>
              <label className="block font-semibold mb-2">Reason for Transfer:</label>
              <input
                type="text"
                value={transferForm.reason}
                onChange={(e) => setTransferForm({...transferForm, reason: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded focus:border-orange-500 focus:outline-none"
                placeholder="Enter reason for transfer"
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
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                Transfer Table
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferTableModal;
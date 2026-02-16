import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';

const AllBookings = ({ setActiveTab }) => {
  const { axios } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferForm, setTransferForm] = useState({ orderId: '', newTable: '' });
  const [addItemsForm, setAddItemsForm] = useState({ orderId: '', itemId: '' });
  const [tables, setTables] = useState([]);
  const [items, setItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ orderId: '', couponCode: '', isLoyalty: false, membership: '' });

  useEffect(() => {
    fetchBookings();
    fetchTables();
    fetchItems();
    fetchCoupons();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

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

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/coupons/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/coupons/apply', {
        orderId: couponForm.orderId,
        couponCode: couponForm.couponCode,
        isLoyalty: couponForm.isLoyalty,
        membership: couponForm.membership
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.success('🎉 Coupon applied successfully!');
      setCouponForm({ orderId: '', couponCode: '', isLoyalty: false, membership: '' });
      fetchBookings();
    } catch (error) {
      console.error('Error applying coupon:', error);
      showToast.error('Failed to apply coupon');
    }
  };

  const searchBookings = async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/search/field', {
        headers: { Authorization: `Bearer ${token}` },
        params: { model: 'restaurant-orders', field: 'customerName', value: query }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error searching bookings:', error);
    }
  };

  const viewDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/restaurant-orders/details/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.info('Order details loaded successfully');
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const generateInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/restaurant-orders/invoice/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const invoiceData = response.data;
      const invoiceContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - Order ${orderId.slice(-6)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .details { margin-bottom: 20px; }
            .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; font-size: 18px; }
            .buttons { margin: 20px 0; text-align: center; }
            .btn { padding: 10px 20px; margin: 0 10px; border: none; border-radius: 5px; cursor: pointer; }
            .btn-print { background-color: #007bff; color: white; }
            .btn-download { background-color: #28a745; color: white; }
            .btn-email { background-color: #ffc107; color: black; }
            @media print { .buttons { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ashoka Restaurant Invoice</h1>
            <p>Invoice #: ${invoiceData.invoiceNumber || orderId.slice(-6)}</p>
            <p>Date: ${new Date(invoiceData.date || Date.now()).toLocaleDateString()}</p>
          </div>
          
          <div class="details">
            <p><strong>Table:</strong> ${invoiceData.tableNo || 'N/A'}</p>
            <p><strong>Customer:</strong> ${invoiceData.customerName || 'N/A'}</p>
            <p><strong>Phone:</strong> ${invoiceData.phoneNumber || 'N/A'}</p>
            <p><strong>Staff:</strong> ${invoiceData.staffName || 'N/A'}</p>
          </div>
          
          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items?.map(item => `
                <tr>
                  <td>${item.name || 'Unknown Item'}</td>
                  <td>${item.quantity || 1}</td>
                  <td>$${item.price || 0}</td>
                  <td>$${(item.quantity || 1) * (item.price || 0)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No items</td></tr>'}
            </tbody>
          </table>
          
          <div class="total">
            <p>Subtotal: $${invoiceData.subtotal || invoiceData.amount || 0}</p>
            ${invoiceData.couponCode ? `
              <p>Coupon Applied: ${invoiceData.couponCode} (-${invoiceData.discountAmount || invoiceData.discount || 0}%)</p>
              <p>Discount: -$${invoiceData.discountValue || 0}</p>
            ` : ''}
            ${invoiceData.isLoyalty ? '<p>Loyalty Member Discount Applied</p>' : ''}
            ${invoiceData.membership ? `<p>Membership ID: ${invoiceData.membership}</p>` : ''}
            <p>Tax: $${invoiceData.tax || 0}</p>
            <p><strong>Total Amount: $${invoiceData.total || invoiceData.finalAmount || invoiceData.amount || 0}</strong></p>
          </div>
          
          <div class="buttons">
            <button class="btn btn-print" onclick="window.print()">Print Invoice</button>
            <button class="btn btn-download" onclick="downloadPDF()">Download PDF</button>
            <button class="btn btn-email" onclick="emailInvoice()">Email Invoice</button>
          </div>
          
          <script>
            function downloadPDF() {
              window.print();
            }
            
            function emailInvoice() {
              const subject = 'Invoice - Order ${orderId.slice(-6)}';
              const body = 'Please find attached your invoice for Order ${orderId.slice(-6)}';
              window.location.href = \`mailto:?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
            }
          </script>
        </body>
        </html>
      `;

      const newWindow = window.open('', '_blank');
      newWindow.document.write(invoiceContent);
      newWindow.document.close();
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast.error('Failed to generate invoice');
    }
  };

  const updateOrderStatus = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/restaurant-orders/${bookingId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.success('✅ Status updated successfully!');
      fetchBookings();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error('Failed to update status');
    }
  };

  const transferTable = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/restaurant-orders/${transferForm.orderId}/transfer-table`, {
        newTableNo: transferForm.newTable,
        reason: 'Customer request'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.success('🔄 Table transferred successfully!');
      setTransferForm({ orderId: '', newTable: '' });
      fetchBookings();
    } catch (error) {
      console.error('Error transferring table:', error);
      showToast.error('Failed to transfer table');
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
      
      const payload = {
        orderId: addItemsForm.orderId,
        name: selectedItem.name || 'Unknown Item',
        category: selectedItem.category || 'General',
        Price: selectedItem.Price || 0
      };
      
      console.log('Selected item:', selectedItem);
      console.log('Payload:', payload);
      
      await axios.post('/api/items/add', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast.success('➕ Items added successfully!');
      setAddItemsForm({ orderId: '', itemId: '' });
      fetchBookings();
    } catch (error) {
      console.error('Error adding items:', error);
      showToast.error('Failed to add items');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchBookings(searchQuery);
    } else {
      fetchBookings();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-text">All Bookings</h2>
          <button
            onClick={() => setActiveTab ? setActiveTab('book') : window.location.href = '/book-table'}
            className="bg-primary text-text px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-hover transition-colors font-semibold text-sm sm:text-base w-full sm:w-auto"
          >
            Book Table
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings..."
              className="flex-1 p-2 border border-border rounded bg-white text-text focus:border-primary focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="bg-primary text-text px-4 py-2 rounded hover:bg-hover transition-colors whitespace-nowrap text-sm"
            >
              Search
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3 text-text text-sm sm:text-base">Transfer Table</h3>
            <form onSubmit={transferTable} className="flex flex-col gap-2">
              <select
                value={transferForm.orderId}
                onChange={(e) => setTransferForm({...transferForm, orderId: e.target.value})}
                className="p-2 border border-border rounded text-sm"
                required
              >
                <option value="">Select Order</option>
                {bookings.map(booking => (
                  <option key={booking._id} value={booking._id}>
                    Order {booking._id.slice(-6)} - Table {booking.tableNo}
                  </option>
                ))}
              </select>
              {transferForm.orderId && (
                <div className="p-2 bg-gray-100 rounded text-sm text-gray-700">
                  {(() => {
                    const selectedBooking = bookings.find(b => b._id === transferForm.orderId);
                    return selectedBooking ? (
                      <div>
                        <div className="font-semibold">Current: Table {selectedBooking.tableNo}</div>
                        <div className="text-xs mt-1">
                          Items: {selectedBooking.items?.length || 0} | Amount: ${selectedBooking.amount || 0} | Status: {selectedBooking.status || 'N/A'}
                        </div>
                        {selectedBooking.items && selectedBooking.items.length > 0 && (
                          <div className="text-xs mt-1 text-gray-600">
                            Items: {selectedBooking.items.map(item => {
                              if (typeof item === 'string') return item;
                              return item.name || item.itemName || 'Unknown Item';
                            }).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()
                  }
                </div>
              )}
              <div className="flex gap-2">
                <select
                  value={transferForm.newTable}
                  onChange={(e) => setTransferForm({...transferForm, newTable: e.target.value})}
                  className="flex-1 p-2 border border-border rounded text-sm"
                  required
                >
                  <option value="">Select New Table</option>
                  {tables.map(table => (
                    <option key={table._id} value={table.tableNumber}>
                      Table {table.tableNumber}
                    </option>
                  ))}
                </select>
                <button type="submit" className="bg-secondary text-text px-4 py-2 rounded hover:bg-hover text-sm whitespace-nowrap">
                  Transfer
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3 text-text text-sm sm:text-base">Add Items</h3>
            <form onSubmit={addItems} className="flex flex-col gap-2">
              {addItemsForm.orderId && (
                <div className="p-2 bg-gray-100 rounded text-sm text-gray-700">
                  {(() => {
                    const selectedBooking = bookings.find(b => b._id === addItemsForm.orderId);
                    return selectedBooking ? (
                      <div>
                        <div className="font-semibold">Order {addItemsForm.orderId.slice(-6)} - Table {selectedBooking.tableNo}</div>
                        <div className="text-xs mt-1">
                          Current Items: {selectedBooking.items?.length || 0} items | Amount: ${selectedBooking.amount || 0}
                        </div>
                        {selectedBooking.items && selectedBooking.items.length > 0 && (
                          <div className="text-xs mt-1 text-gray-600">
                            Items: {selectedBooking.items.map(item => {
                              if (typeof item === 'string') return item;
                              return item.name || item.itemName || 'Unknown Item';
                            }).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>Selected: Order {addItemsForm.orderId.slice(-6)}</div>
                    );
                  })()
                  }
                </div>
              )}
              <select
                value={addItemsForm.itemId}
                onChange={(e) => setAddItemsForm({...addItemsForm, itemId: e.target.value})}
                className="p-2 border border-border rounded text-sm"
                required
              >
                <option value="">Select Item</option>
                {items.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} - {item.category} - ${item.Price}
                  </option>
                ))}
              </select>
              <button 
                type="submit" 
                className="bg-secondary text-text px-4 py-2 rounded hover:bg-hover text-sm"
                disabled={!addItemsForm.orderId}
              >
                Add Item
              </button>
            </form>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3 text-text text-sm sm:text-base">Apply Coupon</h3>
            <form onSubmit={applyCoupon} className="flex flex-col gap-2">
              <select
                value={couponForm.orderId}
                onChange={(e) => setCouponForm({...couponForm, orderId: e.target.value})}
                className="p-2 border border-border rounded text-sm"
                required
              >
                <option value="">Select Order</option>
                {bookings.map(booking => (
                  <option key={booking._id} value={booking._id}>
                    Order {booking._id.slice(-6)} - Table {booking.tableNo}
                  </option>
                ))}
              </select>
              <select
                value={couponForm.couponCode}
                onChange={(e) => setCouponForm({...couponForm, couponCode: e.target.value})}
                className="p-2 border border-border rounded text-sm"
                required
              >
                <option value="">Select Coupon ({coupons.length} available)</option>
                {coupons.length > 0 ? coupons.map(coupon => (
                  <option key={coupon._id || coupon.id} value={coupon.code || coupon.couponCode}>
                    {coupon.code || coupon.couponCode || 'No Code'} - {coupon.discount || coupon.discountPercent || 0}% off
                  </option>
                )) : (
                  <option disabled>No coupons available</option>
                )}
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLoyalty"
                  checked={couponForm.isLoyalty}
                  onChange={(e) => setCouponForm({...couponForm, isLoyalty: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="isLoyalty" className="text-sm">Loyalty Member</label>
              </div>
              <input
                type="text"
                placeholder="Membership ID (optional)"
                value={couponForm.membership}
                onChange={(e) => setCouponForm({...couponForm, membership: e.target.value})}
                className="p-2 border border-border rounded text-sm"
              />
              <button type="submit" className="bg-accent text-text px-4 py-2 rounded hover:bg-hover text-sm">
                Apply Coupon
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] sm:min-w-[800px]">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-1 sm:px-2 md:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Staff</th>
                  <th className="px-1 sm:px-2 md:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm hidden sm:table-cell">Phone</th>
                  <th className="px-1 sm:px-2 md:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Table</th>
                  <th className="px-1 sm:px-2 md:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Items</th>
                  <th className="px-1 sm:px-2 md:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Amount</th>
                  <th className="px-1 sm:px-2 md:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm hidden md:table-cell">Status</th>
                  <th className="px-1 sm:px-2 md:px-4 py-3 text-left text-text font-semibold text-xs sm:text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={booking._id} className={index % 2 === 0 ? 'bg-background' : 'bg-white'}>
                    <td className="px-1 sm:px-2 md:px-4 py-3 text-text text-xs sm:text-sm">{booking.staffName || 'N/A'}</td>
                    <td className="px-1 sm:px-2 md:px-4 py-3 text-text text-xs sm:text-sm hidden sm:table-cell">{booking.phoneNumber || 'N/A'}</td>
                    <td className="px-1 sm:px-2 md:px-4 py-3 text-text text-xs sm:text-sm">{booking.tableNo || 'N/A'}</td>
                    <td className="px-1 sm:px-2 md:px-4 py-3 text-text text-xs sm:text-sm">{booking.items?.length || 0}</td>
                    <td className="px-1 sm:px-2 md:px-4 py-3 text-text text-xs sm:text-sm">${booking.amount || 0}</td>
                    <td className="px-1 sm:px-2 md:px-4 py-3 hidden md:table-cell">
                      <select
                        value={booking.status || 'available'}
                        onChange={(e) => updateOrderStatus(booking._id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs border-0 ${getStatusColor(booking.status || 'available')}`}
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="occupied">Occupied</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-1 sm:px-2 md:px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => viewDetails(booking._id)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 whitespace-nowrap"
                        >
                          View
                        </button>
                        <button
                          onClick={() => generateInvoice(booking._id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 whitespace-nowrap"
                        >
                          Invoice
                        </button>
                        {booking.status !== 'completed' && (
                          <>
                            <button
                              onClick={() => setAddItemsForm({orderId: booking._id, itemId: ''})}
                              className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 whitespace-nowrap"
                            >
                              Add Items
                            </button>
                            <button
                              onClick={() => setTransferForm({...transferForm, orderId: booking._id})}
                              className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600 whitespace-nowrap"
                            >
                              Transfer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {bookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bookings found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllBookings;

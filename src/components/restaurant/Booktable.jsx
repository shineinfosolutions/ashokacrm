import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';

const BookTable = () => {
  const { axios } = useAppContext();
  const [tables, setTables] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [staff, setStaff] = useState([]);
  const [items, setItems] = useState([]);
  const [bookingData, setBookingData] = useState({
    tableNo: '',
    capacity: '',
    location: '',
    customerName: '',
    phoneNumber: '',
    guests: 1,
    couponCode: '',
    membershipDiscount: false,
    loyaltyDiscount: false,
    staffName: '',
    amount: 0,
    items: [{ itemId: '', quantity: 1, amount: 0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch tables
      const tablesRes = await axios.get('/api/restaurant/tables', { headers });
      console.log('Tables response:', tablesRes.data);
      const tablesData = Array.isArray(tablesRes.data) ? tablesRes.data : (tablesRes.data.tables || []);
      setTables(tablesData.filter(table => table.status === 'available'));
      
      // Fetch coupons
      const couponsRes = await axios.get('/api/coupons/all', { headers });
      console.log('Coupons response:', couponsRes.data);
      const couponsData = Array.isArray(couponsRes.data) ? couponsRes.data : (couponsRes.data.coupons || []);
      setCoupons(couponsData);
      
      // Fetch staff
      const staffRes = await axios.get('/api/search/field?model=users&field=role&value=restaurant', { headers });
      console.log('Staff response:', staffRes.data);
      const staffData = Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data.users || staffRes.data.data || []);
      setStaff(staffData);
      
      // Fetch items
      const itemsRes = await axios.get('/api/items/all', { headers });
      console.log('Items response:', itemsRes.data);
      const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : (itemsRes.data.items || []);
      setItems(itemsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set mock data for testing
      setTables([{_id: '1', tableNumber: 'T1', capacity: 4, location: 'restaurant', status: 'available'}]);
      setStaff([{_id: '1', name: 'John Doe'}]);
      setCoupons([{_id: '1', code: 'SAVE10', discount: 10}]);
      setItems([{_id: '1', name: 'Pizza', price: 15.99}]);
    }
  };

  const addItem = () => {
    setBookingData({
      ...bookingData,
      items: [...bookingData.items, { itemId: '', quantity: 1, amount: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const updatedItems = bookingData.items.map((item, i) => {
      if (i === index) {
        if (field === 'itemId') {
          const selectedItem = items.find(menuItem => menuItem._id === value);
          console.log('Selected item:', selectedItem);
          return { 
            ...item, 
            [field]: value,
            price: selectedItem ? (selectedItem.Price || selectedItem.price || 0) : 0,
            amount: selectedItem ? (selectedItem.Price || selectedItem.price || 0) * item.quantity : 0
          };
        } else if (field === 'quantity') {
          const selectedItem = items.find(menuItem => menuItem._id === item.itemId);
          return { 
            ...item, 
            [field]: value,
            amount: selectedItem ? (selectedItem.Price || selectedItem.price || 0) * value : 0
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setBookingData({ ...bookingData, items: updatedItems });
  };

  const removeItem = (index) => {
    setBookingData({
      ...bookingData,
      items: bookingData.items.filter((_, i) => i !== index)
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      console.log('Making POST request to /api/restaurant-orders/create');
      const response = await axios({
        method: 'POST',
        url: '/api/restaurant-orders/create',
        data: bookingData,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Booking response:', response.data);
      showToast.success('🎉 Table booked successfully!');
      setBookingData({
        tableNo: '',
        capacity: '',
        location: '',
        customerName: '',
        phoneNumber: '',
        guests: 1,
        couponCode: '',
        membershipDiscount: false,
        loyaltyDiscount: false,
        staffName: '',
        amount: 0,
        items: [{ itemId: '', quantity: 1, amount: 0 }]
      });
      fetchData();
    } catch (error) {
      console.error('Booking error:', error);
      showToast.error('Booking failed!');
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-text text-center">Book Table</h2>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleBooking} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Table</label>
                <select
                  value={bookingData.tableNo}
                  onChange={(e) => {
                    const selectedTable = tables.find(t => t.tableNumber === e.target.value);
                    setBookingData({
                      ...bookingData, 
                      tableNo: e.target.value,
                      capacity: selectedTable?.capacity || '',
                      location: selectedTable?.location || ''
                    });
                  }}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  required
                >
                  <option value="">Select Table</option>
                  {tables.map(table => (
                    <option key={table._id} value={table.tableNumber}>
                      Table {table.tableNumber} - {table.capacity} seats ({table.location})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{tables.length} available tables</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Staff</label>
                <select
                  value={bookingData.staffName}
                  onChange={(e) => {
                    const selectedStaff = staff.find(s => s._id === e.target.value);
                    setBookingData({...bookingData, staffName: selectedStaff?.name || selectedStaff?.username || ''});
                  }}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select Staff</option>
                  {staff.filter(member => member.restaurantRole === 'staff').map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name || member.username || 'Unknown Staff'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{staff.length} staff members</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Customer Name</label>
                <input
                  type="text"
                  value={bookingData.customerName}
                  onChange={(e) => setBookingData({...bookingData, customerName: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Phone Number</label>
                <input
                  type="tel"
                  value={bookingData.phoneNumber}
                  onChange={(e) => setBookingData({...bookingData, phoneNumber: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text">Guests</label>
              <input
                type="number"
                value={bookingData.guests}
                onChange={(e) => setBookingData({...bookingData, guests: parseInt(e.target.value)})}
                className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-text">Coupon Code</label>
              <div className="space-y-2">
                <select
                  value={bookingData.couponCode}
                  onChange={(e) => setBookingData({...bookingData, couponCode: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Select Coupon</option>
                  {coupons.map(coupon => (
                    <option key={coupon._id} value={coupon.code}>
                      {coupon.code} - {coupon.discount}% off
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bookingData.couponCode}
                  onChange={(e) => setBookingData({...bookingData, couponCode: e.target.value})}
                  placeholder="Or enter coupon code manually"
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center text-text">
                <input
                  type="checkbox"
                  checked={bookingData.membershipDiscount}
                  onChange={(e) => setBookingData({...bookingData, membershipDiscount: e.target.checked})}
                  className="mr-2 accent-primary"
                />
                Membership Discount
              </label>
              <label className="flex items-center text-text">
                <input
                  type="checkbox"
                  checked={bookingData.loyaltyDiscount}
                  onChange={(e) => setBookingData({...bookingData, loyaltyDiscount: e.target.checked})}
                  className="mr-2 accent-primary"
                />
                Loyalty Discount
              </label>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-text">Items</label>
                <button type="button" onClick={addItem} className="bg-secondary text-text px-4 py-2 rounded-lg text-sm hover:bg-hover transition-colors">
                  Add Item
                </button>
              </div>
              {bookingData.items.map((item, index) => {
                const selectedItem = items.find(menuItem => menuItem._id === item.itemId);
                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-border rounded-lg">
                    <select
                      value={item.itemId}
                      onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                      className="p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">Select Item</option>
                      {items.map(menuItem => (
                        <option key={menuItem._id} value={menuItem._id}>
                          {menuItem.name || 'Unknown Item'}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      readOnly
                      className="p-3 border-2 border-border rounded-lg bg-gray-100 text-text focus:border-primary focus:outline-none transition-colors"
                      step="0.01"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-text p-4 rounded-lg hover:bg-hover transition-colors font-semibold text-lg shadow-md"
            >
              Book Table
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookTable;

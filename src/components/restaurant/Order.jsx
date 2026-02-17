import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import { useSocket } from '../../context/SocketContext';
import { useLocation } from 'react-router-dom';
import { useOrderSocket } from '../../hooks/useOrderSocket';
import { motion } from 'framer-motion';

const Order = () => {
  const { axios } = useAppContext();
  const { socket } = useSocket();
  const location = useLocation();
  
  // Real-time order updates
  const { isConnected } = useOrderSocket({
    onNewOrder: (data) => {
      console.log('📱 New order notification received:', data);
      // Optionally refresh data or update UI
    },
    onOrderStatusUpdate: (data) => {
      console.log('📱 Order status update received:', data);
      // Update local state if needed
    },
    showNotifications: false // Disable notifications for order creation page
  });
  const [menuItems, setMenuItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [itemToNote, setItemToNote] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nocs, setNocs] = useState([]);
  const [isNocEnabled, setIsNocEnabled] = useState(false);
  const [selectedNocId, setSelectedNocId] = useState('');
  const [orderData, setOrderData] = useState({
    staffName: '',
    staffId: '',
    customerName: '',
    tableNo: '',
    bookingId: '',
    grcNo: '',
    roomNumber: '',
    guestName: '',
    guestPhone: '',
    items: [],
    amount: 0
  });
  


  useEffect(() => {
    fetchData();
    
    // Pre-fill table data if coming from table selection
    if (location.state?.tableNumber) {
      setOrderData(prev => ({
        ...prev,
        tableNo: location.state.tableNumber
      }));
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      // Fetch items (usually works without auth)
      try {
        const token = localStorage.getItem('token');
        const itemsRes = await axios.get('/api/menu-items', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const itemsData = itemsRes.data.menuItems || itemsRes.data.data || [];
        setMenuItems(itemsData);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
      
      // Fetch bookings
      try {
        const bookingsRes = await axios.get('/api/bookings/all');
        const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data.bookings || []);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
      
      // Fetch restaurant staff
      try {
        const token = localStorage.getItem('token');
        const usersRes = await axios.get('/api/auth/all-users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const usersData = usersRes.data.users || [];
        
        const restaurantStaff = usersData
          .filter(user => user.role === 'restaurant' && user.restaurantRole === 'staff')
          .map(member => ({
            _id: member._id,
            name: member.username,
            username: member.username,
            role: member.role
          }));
        
        setStaff(restaurantStaff);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      }
      
      // Fetch NOCs
      try {
        const nocRes = await axios.get('/api/noc/all');
        const nocData = Array.isArray(nocRes.data) ? nocRes.data : (nocRes.data.nocs || []);
        setNocs(nocData);
      } catch (error) {
        console.error('Error fetching NOCs:', error);
      }
      
      // Fetch tables - Use restaurant tables API
      try {
        const token = localStorage.getItem('token');
        const tablesRes = await axios.get('/api/restaurant/tables/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTables(tablesRes.data);
      } catch (error) {
        console.error('Error fetching tables:', error);
        setTables([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Function to add an item to the cart or increment its quantity
  const handleAddToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i._id === item._id);
      if (existingItem) {
        // If item exists, update its quantity
        return prevItems.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        // If item is new, add it to the cart
        return [...prevItems, { ...item, quantity: 1, note: '', isFree: false, nocId: null }];
      }
    });
  };

  // Function to remove an item from the cart
  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
  };

  // Function to update the quantity of an item in the cart
  const handleQuantityChange = (itemId, change) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
      )
    );
  };

  // Function to open the note modal for a specific item
  const openNoteModal = (item) => {
    setItemToNote(item);
    setIsNoteOpen(true);
  };

  // Function to save a note for the current item and close the modal
  const handleSaveNote = (note) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemToNote._id ? { ...item, note: note } : item
      )
    );
    setIsNoteOpen(false);
    setItemToNote(null);
  };

  // Handle NOC toggle for individual item
  const handleItemNocToggle = (itemId, enabled) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemId
          ? { ...item, isFree: enabled, nocId: enabled ? null : null }
          : item
      )
    );
  };

  // Apply NOC to specific item
  const applyNocToItem = (itemId, nocId) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemId
          ? { ...item, isFree: !!nocId, nocId: nocId || null }
          : item
      )
    );
  };

  // Function to clear all items from the cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Calculate total amount
  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      const price = item.Price || item.price || 0;
      return total + (item.isFree ? 0 : price * item.quantity);
    }, 0);
  };

  // Function to place order
  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return; // Prevent double submission
    
    if (cartItems.length === 0) {
      showToast.error('Please add items to cart first!');
      return;
    }
    
    if (!orderData.tableNo) {
      showToast.error('Please select a table!');
      return;
    }
    

    
    setIsPlacingOrder(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast.error('Authentication token missing. Please login again.');
        return;
      }
      
      const orderItems = cartItems.map(item => ({
        itemId: item._id,
        quantity: item.quantity,
        note: item.note || ''
      }));
      
      // Validate cart items
      const invalidItems = cartItems.filter(item => 
        !item._id || 
        !item.quantity || 
        item.quantity <= 0 || 
        isNaN(item.Price || item.price)
      );
      
      if (invalidItems.length > 0) {
        console.error('Invalid items found:', invalidItems);
        showToast.error('Some items have invalid data. Please refresh and try again.');
        return;
      }
      
        const finalOrderData = {
        staffName: orderData.staffName,
        customerName: orderData.customerName,
        tableNo: orderData.tableNo,
        orderType: 'restaurant',
        items: orderItems.map(item => {
          const cartItem = cartItems.find(ci => ci._id === item.itemId);
          return {
            itemId: item.itemId,
            quantity: item.quantity,
            isFree: cartItem.isFree || false,
            nocId: cartItem.nocId || null
          };
        }),
        notes: cartItems.map(item => item.note).filter(note => note).join(', ') || '',
        subtotal: cartItems.reduce((total, item) => {
          const price = item.Price || item.price || 0;
          return total + price * item.quantity;
        }, 0),
        amount: cartItems.reduce((total, item) => {
          const price = item.Price || item.price || 0;
          return total + (item.isFree ? 0 : price * item.quantity);
        }, 0),
        discount: 0,
        isMembership: false,
        isLoyalty: false
      };
      
      const orderResponse = await axios.post('/api/restaurant-orders/create', finalOrderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      showToast.success('🎉 Order placed successfully!');
      setCartItems([]);
      setOrderData({ staffName: '', staffId: '', customerName: '', tableNo: '', bookingId: '', grcNo: '', roomNumber: '', guestName: '', guestPhone: '', items: [], amount: 0 });
      setIsCartOpen(false);
      
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Check if it's a status validation error and try without status field
      if (error.response?.data?.error?.includes('status') && error.response?.data?.error?.includes('enum')) {
        try {
          // Retry without any status-related fields
          const retryData = { ...finalOrderData };
          delete retryData.status;
          
          const retryResponse = await axios.post('/api/restaurant-orders/create', retryData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          showToast.success('🎉 Order placed successfully!');
          setCartItems([]);
          setOrderData({ staffName: '', staffId: '', customerName: '', tableNo: '', bookingId: '', grcNo: '', roomNumber: '', guestName: '', guestPhone: '', items: [], amount: 0 });
          setIsCartOpen(false);
          return;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to place order!';
      showToast.error(errorMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Filter menu items based on the search query
  const filteredMenu = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen font-sans p-4 sm:p-6 bg-gradient-to-br from-[#f7f5ef] to-[#c3ad6b]/30"
    >
      <div className="w-full bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-[#c3ad6b]/30">
        {/* Real-time connection status */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#b39b5a]">Create New Order</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className={`text-xs font-medium ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {isConnected ? 'Live Updates Active' : 'Offline Mode'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <div className="flex flex-col space-y-3">
            <label htmlFor="table-number" className="font-bold text-[#b39b5a]">Table Number</label>
            <select 
              id="table-number" 
              value={orderData.tableNo}
              onChange={(e) => setOrderData({...orderData, tableNo: e.target.value})}
              className="w-full rounded-xl p-4 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">Select Table</option>
              {tables.filter(table => table.status !== 'occupied').map(table => (
                <option key={table._id} value={table.tableNumber}>
                  Table {table.tableNumber} ({table.status || 'available'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col space-y-3">
            <label htmlFor="staff" className="font-bold text-[#b39b5a]">Staff</label>
            <select 
              id="staff" 
              value={orderData.staffId}
              onChange={(e) => {
                const selectedStaff = staff.find(s => s._id === e.target.value);
                setOrderData({...orderData, staffId: e.target.value, staffName: selectedStaff?.name || selectedStaff?.username || ''});
              }}
              className="w-full rounded-xl p-4 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">Select Staff</option>
              {staff.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name || member.username}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col space-y-3">
            <label htmlFor="customerName" className="font-bold text-[#b39b5a]">Customer Name</label>
            <input
              id="customerName"
              type="text"
              value={orderData.customerName}
              onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
              className="w-full rounded-xl p-4 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200"
              placeholder="Customer Name"
            />
          </div>
        </div>
      </div>

      {/* Search bar section */}
      <div className="w-full bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-[#c3ad6b]/30">
        <label htmlFor="search-menu" className="block font-bold mb-4 text-lg text-[#b39b5a]">Search Menu</label>
        <div className="relative">
          <input
            id="search-menu"
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl pl-12 pr-4 py-4 border-2 border-[#c3ad6b]/30 focus:border-[#c3ad6b] focus:ring-2 focus:ring-[#c3ad6b]/20 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200 text-base"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c3ad6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Menu grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredMenu.map((item, index) => {
        // Debug: Log item structure
        if (index === 0) {
          console.log('Sample menu item structure:', {
            _id: item._id,
            name: item.name,
            category: item.category,
            Price: item.Price,
            price: item.price,
            allKeys: Object.keys(item)
          });
        }
        
        return (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-[#c3ad6b]/30 hover:border-[#c3ad6b] hover:shadow-2xl transition-all duration-300"
          >
            <h3 className="text-xl font-bold truncate text-[#b39b5a] mb-2">{item.name}</h3>
            <p className="mb-4 font-bold text-lg text-gray-800">₹{(item.Price || item.price || 0).toFixed(2)}</p>

            {cartItems.some(i => i._id === item._id) ? (
              // If item is in cart, show the quantity controls
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <button
                    className="bg-border text-text w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-sm sm:text-base"
                    onClick={() => handleQuantityChange(item._id, -1)}
                  >
                    -
                  </button>
                  <span className="font-bold text-text text-sm sm:text-base min-w-[20px] text-center">
                    {cartItems.find(i => i._id === item._id)?.quantity}
                  </span>
                  <button
                    className="bg-primary text-background w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-hover transition-colors text-sm sm:text-base"
                    onClick={() => handleQuantityChange(item._id, 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="text-primary hover:text-hover transition-colors duration-200 text-xs sm:text-sm px-2 py-1 rounded"
                  onClick={() => handleRemoveItem(item._id)}
                >
                  Remove
                </button>
              </div>
            ) : (
              // If item is not in cart, show the "Add to Order" button
              <button
                className="w-full bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a] text-white py-3 rounded-xl font-bold hover:from-[#b39b5a] hover:to-[#c3ad6b] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={() => handleAddToCart(item)}
              >
                Add to Order
              </button>
            )}
          </motion.div>
        );
      })}
      </div>

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          <button
            className="p-4 rounded-full shadow-xl bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a] text-white transition-all duration-300 transform hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#c3ad6b]/30"
            onClick={() => setIsCartOpen(!isCartOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.298.503 1.298H19.5a1 1 0 00.993-.883l.988-7.893z" />
            </svg>
          </button>
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#b39b5a] to-[#c3ad6b] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg animate-pulse">
              {cartItems.length}
            </span>
          )}
        </div>
      </div>

      {/* Cart Popup Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  onClick={() => setIsCartOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.298.503 1.298H19.5a1 1 0 00.993-.883l.988-7.893z" />
                  </svg>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-semibold text-gray-700">Item</th>
                        <th className="text-center py-2 font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-2 font-semibold text-gray-700">Price</th>
                        <th className="text-center py-2 font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map(item => (
                        <tr key={item._id} className="border-b border-gray-100">
                          <td className="py-3">
                            <div>
                              <div className="font-medium text-gray-800">{item.name}</div>
                              <div className="text-xs text-[#c3ad6b]">₹{(item.Price || item.price || 0).toFixed(2)} each</div>
                              {item.note && (
                                <div className="text-xs text-gray-500 italic mt-1">Note: {item.note}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors text-xs"
                                onClick={() => handleQuantityChange(item._id, -1)}
                              >
                                -
                              </button>
                              <span className="font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                              <button
                                className="bg-[#c3ad6b] text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#b39b5a] transition-colors text-xs"
                                onClick={() => handleQuantityChange(item._id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right font-semibold text-gray-800">
                            {item.isFree ? (
                              <div>
                                <span className="line-through text-gray-400">₹{((item.Price || item.price || 0) * item.quantity).toFixed(2)}</span>
                                <div className="text-green-600 font-bold text-xs">FREE</div>
                              </div>
                            ) : (
                              <span>₹{((item.Price || item.price || 0) * item.quantity).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <button
                              className="text-red-500 hover:text-red-700 text-lg font-bold"
                              onClick={() => handleRemoveItem(item._id)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t p-4">
                {/* Per-Item NOC Section */}
                <div className="mb-4">
                  <div className="font-semibold text-gray-700 mb-3">Apply NOC to Items:</div>
                  {cartItems.map(item => (
                    <div key={item._id} className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                        <input
                          type="checkbox"
                          checked={item.isFree}
                          onChange={(e) => handleItemNocToggle(item._id, e.target.checked)}
                          className="rounded text-[#c3ad6b] focus:ring-2 focus:ring-[#c3ad6b]"
                        />
                      </div>
                      {item.isFree && (
                        <select
                          value={item.nocId || ''}
                          onChange={(e) => applyNocToItem(item._id, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#c3ad6b] focus:border-[#c3ad6b]"
                        >
                          <option value="">Select Authority</option>
                          {nocs.map(noc => (
                            <option key={noc._id} value={noc._id}>
                              {noc.name} ({noc.authorityType?.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg text-gray-800">Total: ₹{getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  <button
                    className="w-full py-2 px-4 rounded-md text-gray-700 bg-gray-200 font-semibold hover:bg-gray-300 transition-colors duration-200 text-sm"
                    onClick={handleClearCart}
                  >
                    Clear All
                  </button>
                  <button
                    className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a] font-semibold hover:from-[#b39b5a] hover:to-[#c3ad6b] transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteOpen && itemToNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
            <h2 className="text-xl font-bold text-center text-gray-800 mb-4">Add Your Note</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {['Half', 'Dry', 'Gravy', 'Full'].map(option => (
                <button
                  key={option}
                  className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-sm hover:bg-gray-100 transition-colors duration-200"
                >
                  {option}
                </button>
              ))}
            </div>
            <textarea
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#c3ad6b] text-gray-700 text-sm bg-white"
              placeholder="Write your notes here..."
              defaultValue={itemToNote.note}
              id="note-text-area"
            />
            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="py-2 px-4 rounded-md text-gray-700 bg-gray-200 font-semibold hover:bg-gray-300 transition-colors duration-200 text-sm"
                onClick={() => setIsNoteOpen(false)}
              >
                Cancel
              </button>
              <button
                className="py-2 px-4 rounded-md text-white bg-[#c3ad6b] font-semibold hover:bg-[#b39b5a] transition-colors duration-200 text-sm"
                onClick={() => handleSaveNote(document.getElementById('note-text-area').value)}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Order;
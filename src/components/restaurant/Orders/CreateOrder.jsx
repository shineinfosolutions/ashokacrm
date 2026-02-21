import React from 'react';
import { useCreateOrder } from './hooks/useCreateOrder';
import FloatingCart from './FloatingCart';
import OrderItemsList from './OrderItemsList';

const CreateOrder = ({ onCreateOrder, onCancel }) => {
  const [step, setStep] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [customers, setCustomers] = React.useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false);
  const {
    menuItems,
    tables,
    orderItems,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    guestCount,
    setGuestCount,
    selectedTable,
    setSelectedTable,
    discount,
    setDiscount,
    showMergeOption,
    selectedTablesForMerge,
    selectedCapacity,
    isCapacityMet,
    toggleTableSelection,
    loading,
    loadingMenu,
    error,
    selectedItem,
    selectedVariation,
    setSelectedVariation,
    selectedAddons,
    setSelectedAddons,
    openItemModal,
    closeItemModal,
    addItemToOrder,
    updateItemQuantity,
    removeItem,
    calculateTotal,
    handleSubmit,
    fetchMenuItems
  } = useCreateOrder(onCreateOrder);

  React.useEffect(() => {
    if (customerPhone.length >= 3) {
      fetchCustomers(customerPhone);
    } else {
      setCustomers([]);
      setShowCustomerDropdown(false);
    }
  }, [customerPhone]);

  const fetchCustomers = async (phone) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/customers?phone=${phone}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        setShowCustomerDropdown(data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const selectCustomer = (customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setShowCustomerDropdown(false);
  };

  const handleNext = () => {
    if (!customerName || !guestCount) {
      alert('Please fill in customer name and guest count');
      return;
    }
    setStep(2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Customer Details */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-6">👤 Customer Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                  placeholder="Search by phone..."
                />
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customers.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-0"
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                        <div className="text-xs text-purple-600">🎁 {customer.loyaltyPoints || 0} points</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests *
              </label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                min="1"
                required
              />
            </div>

            {showMergeOption ? (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tables to Merge *
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-50 rounded-xl p-3 border border-gray-200">
                  {tables.filter(t => t.status?.toLowerCase() === 'available').map(table => {
                    const isDisabled = !selectedTablesForMerge.includes(table._id) && isCapacityMet;
                    
                    return (
                      <label key={table._id} className={`flex items-center space-x-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedTablesForMerge.includes(table._id)}
                          disabled={isDisabled}
                          onChange={() => toggleTableSelection(table._id)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {table.tableNumber} (Cap: {table.capacity})
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  Selected: {selectedCapacity}/{guestCount}
                </p>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table (Optional) {tables.length > 0 && `(${tables.filter(t => t.status?.toLowerCase() === 'available').length} available)`}
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">No Table</option>
                  {tables.filter(t => t.status?.toLowerCase() === 'available' && (!guestCount || t.capacity >= parseInt(guestCount))).map(table => (
                    <option key={table._id} value={table._id}>
                      {table.tableNumber} (Capacity: {table.capacity})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md"
            >
              Next: Select Items →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Menu Selection */}
      {step === 2 && (
        <>
          <OrderItemsList
            menuItems={menuItems}
            loadingMenu={loadingMenu}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            fetchMenuItems={fetchMenuItems}
            openItemModal={openItemModal}
          />

          <FloatingCart
            orderItems={orderItems}
            updateItemQuantity={updateItemQuantity}
            removeItem={removeItem}
            calculateTotal={calculateTotal}
            onCheckout={() => handleSubmit()}
            loading={loading}
          />
        </>
      )}

      {/* Item Selection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedItem.itemName}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">Select Variation</label>
              {selectedItem.variation?.map(variation => (
                <label key={variation._id} className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="variation"
                    checked={selectedVariation?._id === variation._id}
                    onChange={() => setSelectedVariation(variation)}
                    className="mr-2"
                  />
                  <span className="text-gray-900">{variation.name} - ₹{variation.price}</span>
                </label>
              ))}
            </div>
            
            {selectedItem.addon?.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">Select Addons</label>
                {selectedItem.addon.map(addon => (
                  <label key={addon._id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedAddons.some(a => a._id === addon._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAddons(prev => [...prev, addon]);
                        } else {
                          setSelectedAddons(prev => prev.filter(a => a._id !== addon._id));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-gray-900">{addon.name} - ₹{addon.price}</span>
                  </label>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={closeItemModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addItemToOrder}
                disabled={!selectedVariation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-md"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default CreateOrder;

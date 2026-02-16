import React from 'react';

const Cart = ({ selectedItems, updateQuantity, getTotalAmount }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mt-4">

      {selectedItems.length > 0 && (
        <div className="space-y-3 pt-4">
          {selectedItems.map(item => (
            <div key={item._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
              <div className="flex-1">
                <h5 className="font-medium text-text">{item.name}</h5>
                <p className="text-sm text-gray-600">₹{(item.Price || item.price || 0).toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <div className="text-right flex-1 sm:flex-none">
                  <p className="font-semibold text-text">₹{((item.Price || item.price || 0) * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-text">Total:</span>
              <span className="text-xl font-bold text-primary">₹{getTotalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

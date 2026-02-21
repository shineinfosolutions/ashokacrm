import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiPhone, FiFileText, FiEye, FiPrinter } from 'react-icons/fi';
import Invoice from './Invoice';

const OrderHistory = () => {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedKOT, setSelectedKOT] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  useEffect(() => {
    fetchOrderHistory();
    fetchRestaurantInfo();
  }, []);

  const fetchRestaurantInfo = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.restaurantId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants/${user.restaurantId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRestaurantInfo(data.restaurant);
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant info:', error);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurant-orders/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const ordersData = Array.isArray(data) ? data : data.orders || [];
        const completedOrders = ordersData.filter(order => 
          order.status === 'PAID' || order.status === 'CANCELLED'
        );
        setHistoryOrders(completedOrders);
      }
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  const getFinalAmount = (order) => {
    const subtotal = order.subtotal || order.totalAmount;
    const discountAmount = order.discount?.percentage ? (subtotal * order.discount.percentage / 100) : 0;
    return subtotal - discountAmount;
  };

  const handlePrintKOT = (order) => {
    const printWindow = window.open('', '_blank');
    const allItems = [...(order.items || []), ...(order.extraItems || [])];
    const subtotal = allItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    const discountAmount = order.discount?.percentage ? (subtotal * order.discount.percentage / 100) : 0;
    const finalAmount = subtotal - discountAmount;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>KOT - ${order.orderNumber}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', monospace; 
              width: 80mm;
              margin: 0;
              padding: 10px;
              font-size: 12px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .item-row { margin: 3px 0; }
            .item-name { font-weight: bold; }
            .item-details { font-size: 10px; margin-left: 10px; }
            .total-row { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="center bold">*** KITCHEN RECEIPT ***</div>
          <div class="center">KOT</div>
          <div class="line"></div>
          
          <div class="row">
            <span>${new Date(order.createdAt).toLocaleDateString()}</span>
            <span>Delivery</span>
            <span>${new Date(order.createdAt).toLocaleTimeString()}</span>
          </div>
          <div class="row">
            <span>ORDER NO:</span>
            <span>${order.orderNumber}</span>
          </div>
          <div class="row">
            <span>TABLE:</span>
            <span>${order.tableNumber || 'N/A'}</span>
          </div>
          <div class="row">
            <span>CUSTOMER:</span>
            <span>${order.customerName}</span>
          </div>
          
          <div class="line"></div>
          
          ${allItems.map(item => `
            <div class="item-row">
              <div class="row">
                <span class="item-name">${item.name}</span>
                <span>₹${(item.itemTotal || 0).toFixed(2)}</span>
              </div>
              ${item.variation ? `<div class="item-details">Variation: ${item.variation.name} - ₹${item.variation.price.toFixed(2)}</div>` : ''}
              ${item.addons && item.addons.length > 0 ? item.addons.map(addon => 
                `<div class="item-details">+ ${addon.name} - ₹${addon.price.toFixed(2)}</div>`
              ).join('') : ''}
              <div class="item-details">Qty: ${item.quantity}</div>
              ${item.specialInstructions ? `<div class="item-details" style="color: #d00;">Note: ${item.specialInstructions}</div>` : ''}
            </div>
          `).join('')}
          
          <div class="line"></div>
          
          <div class="row">
            <span>SUB TOTAL:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="row">
              <span>DISCOUNT (${order.discount.percentage}%):</span>
              <span>-₹${discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="row total-row">
            <span>AMOUNT DUE:</span>
            <span>₹${finalAmount.toFixed(2)}</span>
          </div>
          
          <div class="line"></div>
          <div class="center" style="font-size: 10px; margin-top: 10px;">
            Printed: ${new Date().toLocaleString()}
          </div>
          <div class="center bold" style="margin-top: 10px;">THANK YOU!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse-slow">📜</div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-900 font-medium">Loading history...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn space-y-4">
      {selectedInvoice && (
        <Invoice 
          order={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)}
          restaurantInfo={restaurantInfo}
        />
      )}

      {selectedKOT && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Kitchen Order Ticket</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintKOT(selectedKOT)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  <FiPrinter /> Print
                </button>
                <button
                  onClick={() => setSelectedKOT(null)}
                  className="text-gray-600 hover:text-gray-900 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 font-mono text-sm">
              <div className="text-center font-bold mb-2">*** KITCHEN RECEIPT ***</div>
              <div className="text-center mb-4">KOT</div>
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <div className="flex justify-between mb-1">
                <span>{new Date(selectedKOT.createdAt).toLocaleDateString()}</span>
                <span>Delivery</span>
                <span>{new Date(selectedKOT.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>ORDER NO:</span>
                <span className="font-bold">{selectedKOT.orderNumber}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>TABLE:</span>
                <span className="font-bold">{selectedKOT.tableNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>CUSTOMER:</span>
                <span className="font-bold">{selectedKOT.customerName}</span>
              </div>
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              {[...(selectedKOT.items || []), ...(selectedKOT.extraItems || [])].map((item, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between font-bold">
                    <span>{item.name}</span>
                    <span>₹{(item.itemTotal || 0).toFixed(2)}</span>
                  </div>
                  {item.variation && (
                    <div className="flex justify-between ml-4 text-xs">
                      <span>{item.variation.name}</span>
                      <span>₹{item.variation.price.toFixed(2)}</span>
                    </div>
                  )}
                  {item.addons && item.addons.length > 0 && item.addons.map((addon, addonIdx) => (
                    <div key={addonIdx} className="flex justify-between ml-4 text-xs">
                      <span>+ {addon.name}</span>
                      <span>₹{addon.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="ml-4 text-xs">Qty: {item.quantity}</div>
                  {item.specialInstructions && (
                    <div className="ml-4 text-xs text-red-600 font-semibold">
                      Note: {item.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              
              <div className="flex justify-between mb-1">
                <span>SUB TOTAL:</span>
                <span>₹{((selectedKOT.items || []).reduce((sum, i) => sum + (i.itemTotal || 0), 0) + 
                         (selectedKOT.extraItems || []).reduce((sum, i) => sum + (i.itemTotal || 0), 0)).toFixed(2)}</span>
              </div>
              {selectedKOT.discount?.percentage > 0 && (
                <div className="flex justify-between mb-1">
                  <span>DISCOUNT ({selectedKOT.discount.percentage}%):</span>
                  <span>-₹{(((selectedKOT.items || []).reduce((sum, i) => sum + (i.itemTotal || 0), 0) + 
                            (selectedKOT.extraItems || []).reduce((sum, i) => sum + (i.itemTotal || 0), 0)) * 
                            selectedKOT.discount.percentage / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-2">
                <span>AMOUNT DUE:</span>
                <span>₹{formatCurrency(getFinalAmount(selectedKOT))}</span>
              </div>
              
              <div className="border-t border-dashed border-gray-400 my-3"></div>
              <div className="text-center text-xs text-gray-600 mt-3">
                Printed: {new Date().toLocaleString()}
              </div>
              <div className="text-center font-bold mt-3">THANK YOU!</div>
            </div>
          </div>
        </div>
      )}
      
      {historyOrders.length > 0 ? (
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-white/30 backdrop-blur-md">
              <tr>
                <th className="px-3 lg:px-4 py-3 text-left font-bold text-gray-900 text-sm">Customer</th>
                <th className="px-3 lg:px-4 py-3 text-left font-bold text-gray-900 text-sm">Table</th>
                <th className="px-3 lg:px-4 py-3 text-left font-bold text-gray-900 text-sm">Items</th>
                <th className="px-3 lg:px-4 py-3 text-left font-bold text-gray-900 text-sm">Net Amount</th>
                <th className="px-3 lg:px-4 py-3 text-left font-bold text-gray-900 text-sm">Status</th>
                <th className="px-3 lg:px-4 py-3 text-left font-bold text-gray-900 text-sm">Date</th>
                <th className="px-3 lg:px-4 py-3 text-left font-bold text-gray-900 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/20 backdrop-blur-md">
              {historyOrders.map((order, index) => (
                <React.Fragment key={order._id}>
                  <tr 
                    className="border-t border-white/20 hover:bg-white/10 transition-all"
                  >
                    <td className="px-3 lg:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                          className="flex-shrink-0"
                        >
                          <FiChevronDown className={`transition-transform ${expandedOrder === order._id ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{order.customerName}</p>
                          {order.customerPhone && (
                            <p className="text-xs text-gray-700 truncate"><FiPhone className="inline mr-1" /> {order.customerPhone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 lg:px-4 py-3 text-gray-900 text-sm">{order.tableNumber || 'N/A'}</td>
                    <td className="px-3 lg:px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {expandedOrder === order._id ? (
                          order.items?.map((item, idx) => (
                            <span key={idx} className="bg-white/30 backdrop-blur-md text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap">
                              {item.quantity}x {item.name}
                            </span>
                          ))
                        ) : (
                          <>
                            {order.items?.slice(0, 2).map((item, idx) => (
                              <span key={idx} className="bg-white/30 backdrop-blur-md text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                            {order.items?.length > 2 && (
                              <span className="text-xs text-gray-700 whitespace-nowrap">+{order.items.length - 2} more</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-4 py-3 font-bold text-green-1000 text-sm whitespace-nowrap">{formatCurrency(getFinalAmount(order))}</td>
                    <td className="px-3 lg:px-4 py-3">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                        order.status === 'DELIVERED' ? 'bg-green-600 text-white' :
                        order.status === 'READY' ? 'bg-blue-600 text-white' :
                        'bg-red-500/30 text-red-900 backdrop-blur-md'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 lg:px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                      <div>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p>{new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="px-3 lg:px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          title="View Invoice"
                        >
                          <FiFileText /> Invoice
                        </button>
                        <button
                          onClick={() => setSelectedKOT(order)}
                          className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          title="View KOT"
                        >
                          <FiEye /> View KOT
                        </button>
                        <button
                          onClick={() => handlePrintKOT(order)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                          title="Print KOT"
                        >
                          <FiPrinter />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-2xl shadow-xl">
          <div className="text-6xl mb-4 animate-pulse-slow">📜</div>
          <p className="text-gray-500 text-lg font-medium">No order history available</p>
          <p className="text-gray-400 text-sm mt-2">Completed orders will appear here</p>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

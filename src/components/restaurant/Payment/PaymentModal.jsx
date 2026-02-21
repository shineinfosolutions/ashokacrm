import React, { useState, useEffect } from 'react';
import { FiX, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import SplitBill from './SplitBill';
import SplitBillPayment from './SplitBillPayment';

const PaymentModal = ({ order, onProcessPayment, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [splitBillData, setSplitBillData] = useState(null);
  const [existingSplitBill, setExistingSplitBill] = useState(null);
  const [checkingSplit, setCheckingSplit] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [loyaltySettings, setLoyaltySettings] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [paymentDiscount, setPaymentDiscount] = useState(0);

  // Check if split bill already exists
  useEffect(() => {
    checkExistingSplitBill();
    fetchCustomerLoyalty();
  }, [order._id]);

  const fetchCustomerLoyalty = async () => {
    if (!order.customerPhone) return;
    try {
      const token = localStorage.getItem('token');
      const [customerRes, settingsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/customers?phone=${order.customerPhone}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${import.meta.env.VITE_API_URL}/api/loyalty/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);
      if (customerRes?.ok) {
        const customers = await customerRes.json();
        const foundCustomer = customers.find(c => c.phone === order.customerPhone);
        setCustomer(foundCustomer);
      }
      if (settingsRes?.ok) {
        const settings = await settingsRes.json();
        setLoyaltySettings(settings);
      }
    } catch (error) {
      // Silently fail - loyalty is optional
    }
  };

  const checkExistingSplitBill = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/split-bill/${order._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);
      if (response?.ok) {
        const data = await response.json();
        setExistingSplitBill(data.splitBill);
      }
    } catch (error) {
      // Silently fail - split bill is optional
    } finally {
      setCheckingSplit(false);
    }
  };

  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: FiDollarSign },
    { value: 'CARD', label: 'Card', icon: FiCreditCard },
    { value: 'UPI', label: 'UPI', icon: FiCreditCard },
    { value: 'ONLINE', label: 'Online', icon: FiCreditCard }
  ];

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  const calculateDiscount = () => {
    if (!loyaltySettings || pointsToRedeem === 0) return 0;
    return pointsToRedeem / loyaltySettings.redeemRate;
  };

  const getFinalAmount = () => {
    const discountAmount = (order.totalAmount * paymentDiscount) / 100;
    return Math.max(0, order.totalAmount - discountAmount - calculateDiscount());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((paymentMethod !== 'CASH') && !transactionId.trim()) {
      setError('Transaction ID is required for non-cash payments');
      return;
    }

    setLoading(true);
    setError('');

    const paymentData = {
      method: paymentMethod,
      amount: getFinalAmount(),
      transactionId: transactionId.trim() || undefined,
      loyaltyPointsUsed: pointsToRedeem
    };

    const result = await onProcessPayment(order._id, paymentData);
    
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {order.status === 'PAID' ? (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-5xl mb-3">✅</div>
              <h4 className="text-xl font-bold text-green-800 mb-2">Payment Already Completed</h4>
              <p className="text-sm text-green-700 mb-4">This order has already been paid.</p>
              {order.paymentDetails && (
                <div className="text-sm text-gray-700 space-y-1">
                  <p><span className="font-medium">Method:</span> {order.paymentDetails.method}</p>
                  {order.paymentDetails.paidAt && (
                    <p><span className="font-medium">Paid at:</span> {new Date(order.paymentDetails.paidAt).toLocaleString()}</p>
                  )}
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-500/80 backdrop-blur-md border border-red-600/50 text-white px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">Order Number:</span>
                <span className="font-medium text-gray-900">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">Customer:</span>
                <span className="font-medium text-gray-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.subtotal || order.totalAmount)}</span>
              </div>
              {order.discount?.percentage > 0 && (
                <div className="flex justify-between items-center mb-2 text-orange-600">
                  <span className="text-sm">Discount ({order.discount.percentage}%):</span>
                  <span className="font-medium">-{formatCurrency((order.subtotal || order.totalAmount) * order.discount.percentage / 100)}</span>
                </div>
              )}
              {paymentDiscount > 0 && (
                <div className="flex justify-between items-center mb-2 text-blue-600">
                  <span className="text-sm">Payment Discount ({paymentDiscount}%):</span>
                  <span className="font-medium">-{formatCurrency((order.totalAmount * paymentDiscount) / 100)}</span>
                </div>
              )}
              {pointsToRedeem > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span className="text-sm">Loyalty Discount:</span>
                  <span className="font-medium">-{formatCurrency(calculateDiscount())}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm text-gray-700">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(getFinalAmount())}
                </span>
              </div>
            </div>

            {/* Loyalty Points */}
            {customer && customer.loyaltyPoints > 0 && loyaltySettings && (
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-900">🎁 Loyalty Points</span>
                  <span className="text-sm font-bold text-purple-600">{customer.loyaltyPoints} pts available</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">{loyaltySettings.redeemRate} points = ₹1 discount</p>
                <input
                  type="number"
                  min="0"
                  max={Math.min(customer.loyaltyPoints, Math.floor(order.totalAmount * loyaltySettings.redeemRate))}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(Math.min(Number(e.target.value), customer.loyaltyPoints, Math.floor(order.totalAmount * loyaltySettings.redeemRate)))}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Points to redeem"
                />
                {pointsToRedeem > 0 && (
                  <p className="text-xs text-green-600 mt-2 font-medium">💰 You'll save {formatCurrency(calculateDiscount())}</p>
                )}
              </div>
            )}

            {/* Payment Discount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Payment Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={paymentDiscount}
                onChange={(e) => setPaymentDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-xl transition-all ${
                        paymentMethod === method.value
                          ? 'bg-blue-600 text-white shadow-md border border-blue-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      <IconComponent size={18} />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transaction ID */}
            {paymentMethod !== 'CASH' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter transaction ID"
                  required
                />
              </div>
            )}

            {/* Split Bill Option - Only show if no payment made */}
            {!order.paymentDetails && !order.status === 'PAID' && !existingSplitBill && (order.items.length > 1 || (order.extraItems && order.extraItems.length > 0)) && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-700 mb-3 font-medium">💳 Payment Options</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSplitBill(true)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium shadow-md"
                  >
                    Split Bill
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">💡 Split equally or by items among multiple people</p>
              </div>
            )}

            {!order.paymentDetails && order.status !== 'PAID' && existingSplitBill && existingSplitBill.status === 'ACTIVE' && (
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm text-gray-700 mb-3 font-medium">💳 Split Payment Active</p>
                <button
                  type="button"
                  onClick={() => {
                    setSplitBillData(existingSplitBill);
                    setShowSplitPayment(true);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-sm font-medium shadow-md"
                >
                  View Split Payments
                </button>
                <p className="text-xs text-gray-500 mt-2">💡 Continue paying individual splits</p>
              </div>
            )}

            {!order.paymentDetails && order.status !== 'PAID' && existingSplitBill && existingSplitBill.status === 'COMPLETED' && (
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">✅</span>
                  <p className="text-sm text-green-800 font-bold">All Splits Paid!</p>
                </div>
                <div className="space-y-2">
                  {existingSplitBill.splits.map((split) => (
                    <div key={split.splitNumber} className="flex justify-between items-center text-xs bg-white/50 rounded-lg p-2">
                      <span className="text-gray-700">{split.customerName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-700">₹{split.totalAmount.toFixed(2)}</span>
                        <span className="text-green-600">✓ {split.paymentDetails?.method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                {loading ? 'Processing...' : `Pay ${formatCurrency(getFinalAmount())}`}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Split Bill Modals */}
      {!order.paymentDetails && order.status !== 'PAID' && showSplitBill && (
        <SplitBill 
          orderId={order._id} 
          onClose={() => setShowSplitBill(false)}
          onSplitCreated={(splitBill) => {
            setSplitBillData(splitBill);
            setShowSplitBill(false);
            setShowSplitPayment(true);
          }}
        />
      )}
      
      {!order.paymentDetails && order.status !== 'PAID' && showSplitPayment && (
        <SplitBillPayment 
          orderId={order._id}
          splitBillData={splitBillData}
          onPaymentComplete={() => {
            setShowSplitPayment(false);
            setSplitBillData(null);
            onClose();
          }}
          onClose={() => {
            setShowSplitPayment(false);
            setSplitBillData(null);
          }} 
        />
      )}
    </div>
  );
};

export default PaymentModal;

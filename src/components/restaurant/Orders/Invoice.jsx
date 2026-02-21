import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiPrinter } from 'react-icons/fi';
import { RiPhoneFill, RiMailFill } from 'react-icons/ri';

const Invoice = ({ order, onClose, restaurantInfo }) => {
  const invoiceRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;

  // Calculate totals
  const itemsTotal = (order.items || []).reduce((sum, item) => sum + (item.itemTotal || 0), 0);
  const extraItemsTotal = (order.extraItems || []).reduce((sum, item) => sum + (item.itemTotal || 0), 0);
  const calculatedSubtotal = itemsTotal + extraItemsTotal;
  const discountAmount = order.discount?.percentage ? (calculatedSubtotal * order.discount.percentage / 100) : 0;
  const finalAmount = calculatedSubtotal - discountAmount;

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible !important; }
          .print-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            box-sizing: border-box;
            padding: 10px;
          }
          .no-print { display: none !important; }
          @page { 
            margin: 0.2in; 
            size: A4;
          }
          body { margin: 0; padding: 0; background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-content { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .client-details-grid { display: table !important; width: 100% !important; page-break-inside: avoid !important; }
          .client-details-left, .client-details-right { display: table-cell !important; vertical-align: top !important; page-break-inside: avoid !important; }
          .client-details-left { border-right: 1px solid black !important; width: 50% !important; }
          .client-details-right { width: 50% !important; }
          .contact-info {
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            font-size: 10px !important;
          }
        }
      `}</style>
      
      <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 backdrop-blur-sm z-[9999] flex items-center pl-[300px] print:p-0 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto print:max-h-none print:shadow-none print:rounded-none"
        >
          {/* Header Actions - Hidden on Print */}
          <div className="flex justify-end gap-2 p-4 border-b no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              <FiPrinter /> Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiX /> Close
            </button>
          </div>

          <div className="min-h-screen bg-white p-2 sm:p-4">
            <div className="max-w-7xl mx-auto border-2 border-black p-2 sm:p-4 print-content relative">
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 space-y-4 lg:space-y-0">
                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <span className="text-white font-bold text-4xl">{restaurantInfo?.restaurantName?.charAt(0) || 'R'}</span>
                    </div>
                    <div className="text-xs text-center sm:text-left">
                      <p className="font-bold text-sm sm:text-base">{restaurantInfo?.restaurantName || 'Restaurant Name'}</p>
                      <p className="text-xs">{restaurantInfo?.address || 'Restaurant Address'}</p>
                      <p className="text-xs">{restaurantInfo?.city || 'City, State, Pincode'}</p>
                      {restaurantInfo?.website && <p className="text-xs">Website: {restaurantInfo.website}</p>}
                      <p className="text-xs">{restaurantInfo?.email || 'contact@restaurant.com'}</p>
                      {restaurantInfo?.gstin && <p className="text-xs font-semibold">GSTIN: {restaurantInfo.gstin}</p>}
                    </div>
                  </div>
                  <div className="contact-info flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="text-xs flex items-center space-x-2">
                      <RiPhoneFill className="text-lg text-yellow-600" />
                      <span>{restaurantInfo?.phone || '+91-XXXX-XXXXXX'}</span>
                    </div>
                    <div className="text-xs flex items-center space-x-2">
                      <RiMailFill className="text-lg text-yellow-600" />
                      <span>{restaurantInfo?.email || 'contact@restaurant.com'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center font-bold text-lg mb-4">
                  RESTAURANT INVOICE
                </div>
                
                <div className="client-details-grid grid grid-cols-1 lg:grid-cols-2 text-xs border border-black mb-4">
                  <div className="client-details-left border-r border-black p-2">
                    <div className="client-info-grid grid grid-cols-3 gap-x-1 gap-y-1">
                      <p className="col-span-1">Name</p>
                      <p className="col-span-2">: {order.customerName || 'N/A'}</p>
                    </div>
                    <div className="invoice-info-grid grid grid-cols-2 gap-y-1 mt-4">
                      <p className="font-bold">Bill No. & Date</p>
                      <p className="font-medium">: {order.orderNumber || order._id?.slice(-8)} {new Date(order.createdAt).toLocaleDateString()}</p>
                      <p className="font-bold">GRC No.</p>
                      <p className="font-medium">: {order.grcNumber || 'GRC0058'}</p>
                      <p className="font-bold">Table/Room</p>
                      <p className="font-medium">: {order.tableNumber || 'N/A'}</p>
                      <p className="font-bold">Order Date</p>
                      <p className="font-medium">: {new Date(order.createdAt).toLocaleDateString()}</p>
                      <p className="font-bold">Order Time</p>
                      <p className="font-medium">: {new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="client-details-right p-2">
                  </div>
                </div>

                <div className="mb-4 overflow-x-auto">
                  <table className="items-table w-full text-xs border-collapse">
                    <thead>
                      <tr className="border border-black bg-gray-200">
                        <th className="p-1 border border-black whitespace-nowrap">S.No</th>
                        <th className="p-1 border border-black whitespace-nowrap">Item Name</th>
                        <th className="p-1 border border-black text-center whitespace-nowrap">Qty</th>
                        <th className="p-1 border border-black text-right whitespace-nowrap">Rate</th>
                        <th className="p-1 border border-black text-center whitespace-nowrap">HSN/SAC</th>
                        <th className="p-1 border border-black text-right whitespace-nowrap">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item, index) => (
                        <tr key={index} className="border border-black">
                          <td className="p-1 border border-black text-center">{index + 1}</td>
                          <td className="p-1 border border-black">{item.name}</td>
                          <td className="p-1 border border-black text-center">{item.quantity}</td>
                          <td className="p-1 border border-black text-right">{formatCurrency(item.variation?.price || item.basePrice || 0)}</td>
                          <td className="p-1 border border-black text-center">{item.hsn || '996331'}</td>
                          <td className="p-1 border border-black text-right font-bold">{formatCurrency(item.itemTotal || 0)}</td>
                        </tr>
                      ))}
                      {order.extraItems?.map((item, index) => (
                        <tr key={`extra-${index}`} className="border border-black">
                          <td className="p-1 border border-black text-center">{order.items.length + index + 1}</td>
                          <td className="p-1 border border-black">{item.name}</td>
                          <td className="p-1 border border-black text-center">{item.quantity}</td>
                          <td className="p-1 border border-black text-right">{formatCurrency(item.variation?.price || item.basePrice || 0)}</td>
                          <td className="p-1 border border-black text-center">{item.hsn || '996331'}</td>
                          <td className="p-1 border border-black text-right font-bold">{formatCurrency(item.itemTotal || 0)}</td>
                        </tr>
                      ))}
                      <tr className="border border-black bg-gray-100">
                        <td colSpan="5" className="p-1 text-right font-bold border border-black">SUB TOTAL :</td>
                        <td className="p-1 text-right border border-black font-bold">{formatCurrency(calculatedSubtotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mb-4 flex justify-end">
                  <div className="w-full lg:w-1/2">
                    <p className="font-bold mb-1">Net Amount Summary</p>
                    <table className="w-full border-collapse border border-black">
                      <tbody>
                        <tr>
                          <td className="p-1 text-right text-xs font-medium">Subtotal:</td>
                          <td className="p-1 border-l border-black text-right text-xs">{formatCurrency(calculatedSubtotal)}</td>
                        </tr>
                        <tr className="text-green-600">
                          <td className="p-1 text-right text-xs font-medium">
                            Discount ({order.discount?.percentage || 0}%):
                          </td>
                          <td className="p-1 border-l border-black text-right text-xs">-{formatCurrency(discountAmount)}</td>
                        </tr>
                        <tr className="font-bold">
                          <td className="p-1 text-right text-xs">NET AMOUNT:</td>
                          <td className="p-1 border-l border-black text-right text-xs">{formatCurrency(finalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-xs">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-b border-t border-black py-4">
                    <div>
                      <p className="font-bold">PAYMENT METHOD:</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" checked={order.paymentMethod === 'cash'} readOnly /> CASH
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" checked={order.paymentMethod === 'card'} readOnly /> CARD
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" checked={order.paymentMethod === 'upi'} readOnly /> UPI
                        </label>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">RESTAURANT TIMING: {restaurantInfo?.timing || '7:00 AM - 11:00 PM'}</p>
                      <p>Thank you for dining with us!</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 mt-4 gap-2 sm:gap-0">
                    <div className="text-left font-bold">RESTAURANT MANAGER</div>
                    <div className="text-center font-bold">CASHIER</div>
                    <div className="text-right font-bold">Customer Sign.</div>
                    <div className="text-left text-xs">Subject to {restaurantInfo?.city || 'Local'} Jurisdiction only.</div>
                    <div className="text-center text-xs">E. & O.E.</div>
                    <div></div>
                  </div>
                  <p className="mt-4 text-center text-lg font-bold">Thank You, Visit Again</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Invoice;

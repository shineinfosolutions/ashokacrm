import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ashokaLogo from '../../assets/logo.png';
import { RiPhoneFill, RiMailFill } from 'react-icons/ri';
import { useAppContext } from '../../context/AppContext';

export default function RestaurantTaxInvoice() {
  const { axios } = useAppContext();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/restaurant-orders/details/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId, axios]);

  if (loading) return <div className="min-h-screen bg-white p-4 flex items-center justify-center">Loading Invoice...</div>;
  if (!order) return <div className="min-h-screen bg-white p-4 flex items-center justify-center text-red-600">Order not found</div>;

  const subtotal = order.items.reduce((sum, item) => sum + (item.isFree ? 0 : item.price * item.quantity), 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal + cgst + sgst;

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible !important; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 0.2in; size: A4; }
        }
      `}</style>
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-7xl mx-auto border-2 border-black p-4 print-content relative" style={{
          backgroundImage: `url(${ashokaLogo})`,
          backgroundSize: '40%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <div className="absolute inset-0 bg-white/80 pointer-events-none"></div>
          <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <img src={ashokaLogo} alt="Ashoka Logo" className="w-24 h-24" />
              <div className="text-xs">
                <p className="font-bold text-base">HOTEL ASHOKA</p>
                <p>Deoria Bypass Rd, near LIC Office Gorakhpur</p>
                <p>Taramandal, Gorakhpur, Uttar Pradesh 273016</p>
                <p>Website: <a href="https://hotelashoka.com" className="text-blue-600">hotelashoka.com</a></p>
                <p>contact@hotelashoka.in</p>
                <p className="font-semibold">GSTIN: 09ACIFA2416J1ZF</p>
              </div>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <RiPhoneFill className="text-lg text-yellow-600" />
                <span>+91-XXXX-XXXXXX</span>
              </div>
              <div className="flex items-center space-x-2">
                <RiMailFill className="text-lg text-yellow-600" />
                <span>contact@hotelashoka.in</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-center font-bold text-lg flex-1">RESTAURANT TAX INVOICE</div>
            <button onClick={() => window.print()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm no-print">Print</button>
          </div>

          <div className="grid grid-cols-2 text-xs border border-black mb-4">
            <div className="border-r border-black p-2">
              <p><span className="font-bold">Name:</span> {order.customerName || 'Guest'}</p>
              <div className="mt-4 space-y-1">
                <p><span className="font-bold">Bill No. & Date:</span> REST-{order._id.slice(-6)} {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><span className="font-bold">Table Number:</span> {order.tableNo}</p>
                <p><span className="font-bold">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><span className="font-bold">Order Time:</span> {new Date(order.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="p-2"></div>
          </div>

          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="border border-black bg-gray-200">
                <th className="p-1 border border-black">S.No</th>
                <th className="p-1 border border-black">Item Name</th>
                <th className="p-1 border border-black text-center">Qty</th>
                <th className="p-1 border border-black text-right">Rate</th>
                <th className="p-1 border border-black text-center">HSN/SAC</th>
                <th className="p-1 border border-black text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border border-black">
                  <td className="p-1 border border-black text-center">{index + 1}</td>
                  <td className="p-1 border border-black">{item.itemName}{item.isFree ? ' (NC)' : ''}</td>
                  <td className="p-1 border border-black text-center">{item.quantity}</td>
                  <td className="p-1 border border-black text-right">₹{item.price.toFixed(2)}</td>
                  <td className="p-1 border border-black text-center">996331</td>
                  <td className="p-1 border border-black text-right font-bold">{item.isFree ? 'FREE' : `₹${(item.price * item.quantity).toFixed(2)}`}</td>
                </tr>
              ))}
              <tr className="border border-black bg-gray-100">
                <td colSpan="5" className="p-1 text-right font-bold border border-black">SUB TOTAL:</td>
                <td className="p-1 text-right border border-black font-bold">₹{subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end mb-4">
            <div className="w-1/2">
              <p className="font-bold mb-1">Net Amount Summary</p>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">Subtotal:</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">SGST (2.5%):</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">CGST (2.5%):</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{cgst.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-gray-200">
                    <td className="p-1 font-bold text-right text-xs">NET AMOUNT:</td>
                    <td className="p-1 border-l border-black text-right font-bold text-xs">₹{total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs border-t border-b border-black py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold">PAYMENT METHOD:</p>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center"><input type="checkbox" className="mr-2" /> CASH</label>
                  <label className="flex items-center"><input type="checkbox" className="mr-2" /> CARD</label>
                  <label className="flex items-center"><input type="checkbox" className="mr-2" /> UPI</label>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">RESTAURANT TIMING: 7:00 AM - 11:00 PM</p>
                <p>Thank you for dining with us!</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 mt-4 text-xs">
            <div className="font-bold">RESTAURANT MANAGER</div>
            <div className="text-center font-bold">CASHIER</div>
            <div className="text-right font-bold">Customer Sign.</div>
          </div>
          <p className="mt-4 text-center text-lg font-bold">Thank You, Visit Again</p>
        </div>
        </div>
      </div>
    </>
  );
}

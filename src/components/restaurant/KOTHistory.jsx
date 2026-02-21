import React, { useState, useEffect } from 'react';
import { FiFileText, FiCalendar, FiClock, FiGrid, FiPrinter } from 'react-icons/fi';

const KOTHistory = () => {
  const [historyKots, setHistoryKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedKot, setExpandedKot] = useState(null);

  useEffect(() => {
    fetchKOTHistory();
  }, []);

  const fetchKOTHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/kitchen/all/kitchen/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const completedKots = (data.kots || []).filter(kot => 
          kot.status === 'DELIVERED' || kot.status === 'CANCELLED' || kot.status === 'PAID'
        );
        setHistoryKots(completedKots);
      }
    } catch (error) {
      console.error('Error fetching KOT history:', error);
    }
    setLoading(false);
  };

  const handlePrintKOT = (kot) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html><head><title>KOT ${kot.kotNumber}</title>
      <style>
        body{font-family:Arial;padding:20px;margin:0;}
        .header{display:flex;justify-content:space-between;align-items:center;border:2px solid #000;padding:15px;margin-bottom:20px;}
        .logo{background:#ff6600;color:#fff;width:60px;height:60px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;}
        .title{text-align:center;font-size:20px;font-weight:bold;margin:20px 0;}
        .info-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
        .info-table td{border:1px solid #000;padding:8px;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #000;padding:8px;text-align:left;}
        th{background:#f0f0f0;font-weight:bold;}
        .text-right{text-align:right;}
        .footer{margin-top:30px;text-align:center;font-weight:bold;}
      </style>
      </head><body>
      <div class="header">
        <div class="logo">R</div>
        <div>
          <strong>Restaurant Name</strong><br>
          <small>Restaurant Address</small>
        </div>
        <div style="text-align:right;">
          <small>📞 +91-XXXX-XXXXXX</small><br>
          <small>📧 contact@restaurant.com</small>
        </div>
      </div>
      <div class="title">KITCHEN ORDER TICKET</div>
      <table class="info-table">
        <tr>
          <td><strong>KOT No.:</strong> ${kot.kotNumber}</td>
          <td><strong>Order No.:</strong> ${kot.orderNumber}</td>
        </tr>
        <tr>
          <td><strong>Table/Room:</strong> ${kot.tableNumber || 'N/A'}</td>
          <td><strong>Customer:</strong> ${kot.customerName || 'Guest'}</td>
        </tr>
        <tr>
          <td><strong>Order Date:</strong> ${new Date(kot.createdAt).toLocaleDateString()}</td>
          <td><strong>Order Time:</strong> ${new Date(kot.createdAt).toLocaleTimeString()}</td>
        </tr>
      </table>
      <table>
        <tr><th>S.No</th><th>Item Name</th><th>Qty</th></tr>
        ${kot.items?.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.name}${item.variation ? ` (${item.variation.name})` : ''}</td>
            <td>${item.quantity}</td>
          </tr>
        `).join('')}
      </table>
      <div class="footer">Thank You, Visit Again</div>
      </body></html>
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
  }

  return (
    <div className="animate-fadeIn space-y-4">
      {historyKots.map((kot, index) => (
        <div 
          key={kot._id} 
          className="bg-[#1f2937] rounded-xl shadow-lg border border-[#c2ab65] hover:shadow-xl transition-all duration-300 animate-fadeIn"
          style={{ animationDelay: `${index * 0.03}s` }}
        >
          <div 
            className="p-4 cursor-pointer"
            onClick={() => setExpandedKot(expandedKot === kot._id ? null : kot._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl font-bold text-white ${
                  kot.status === 'DELIVERED' ? 'bg-green-500' :
                  kot.status === 'PAID' ? 'bg-[#c2ab65] text-[#1f2937]' :
                  'bg-red-500'
                }`}>
                  {kot.status === 'DELIVERED' ? '✅' :
                   kot.status === 'PAID' ? '💰' : '❌'}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-[#c2ab65]">{kot.kotNumber}</h3>
                  <p className="text-sm text-gray-300 flex items-center gap-1"><FiFileText className="inline" /> Order: {kot.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrintKOT(kot); }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
                >
                  <FiPrinter /> Print
                </button>
                <div className="text-right">
                  <p className="text-sm text-gray-300 flex items-center gap-1 justify-end"><FiCalendar className="inline" /> {new Date(kot.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-300 flex items-center gap-1 justify-end"><FiClock className="inline" /> {new Date(kot.createdAt).toLocaleTimeString()}</p>
                  {kot.tableNumber && (
                    <p className="text-sm text-gray-300 flex items-center gap-1 justify-end"><FiGrid className="inline" /> Table: {kot.tableNumber}</p>
                  )}
                </div>
                <div className={`text-2xl text-[#c2ab65] transition-transform ${
                  expandedKot === kot._id ? 'rotate-180' : ''
                }`}>
                  ▼
                </div>
              </div>
            </div>
          </div>

          {expandedKot === kot._id && (
            <div className="px-4 pb-4 pt-0">
              <div className="flex flex-wrap gap-2 border-t border-[#c2ab65] pt-4">
                {kot.items?.map((item, idx) => (
                  <div key={idx} className="bg-[#2d3748] rounded-lg px-3 py-2 border border-gray-600">
                    <span className="font-medium text-white">
                      <span className="bg-[#c2ab65] text-[#1f2937] font-bold px-2 py-0.5 rounded-full text-xs mr-2">
                        {item.quantity}x
                      </span>
                      {item.name}
                    </span>
                    {item.variation && (
                      <span className="text-sm text-gray-400 ml-2">({item.variation.name})</span>
                    )}
                  </div>
                ))}
                {kot.extraItems?.map((item, idx) => (
                  <div key={`extra-${idx}`} className="bg-[#2d3748] rounded-lg px-3 py-2 border border-blue-500">
                    <span className="font-medium text-white">
                      <span className="bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full text-xs mr-2">
                        {item.quantity}x
                      </span>
                      {item.name}
                      <span className="ml-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded">NEW</span>
                    </span>
                    {item.variation && (
                      <span className="text-sm text-gray-400 ml-2">({item.variation.name})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {historyKots.length === 0 && (
        <div className="text-center py-16 bg-[#1f2937] rounded-2xl shadow-xl border border-[#c2ab65]">
          <div className="text-6xl mb-4 animate-pulse-slow">📜</div>
          <p className="text-gray-300 text-lg font-medium">No KOT history available</p>
          <p className="text-gray-500 text-sm mt-2">Completed orders will appear here</p>
        </div>
      )}
    </div>
  );
};

export default KOTHistory;

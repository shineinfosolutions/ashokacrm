import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const InRoomKOT = () => {
  const { orderId } = useParams();
  const { axios } = useAppContext();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/inroom-orders/details/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);
      
      // Auto-print after data loads
      setTimeout(() => window.print(), 500);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div style={{ width: '80mm', margin: '0 auto', fontFamily: 'monospace', fontSize: '10px', padding: '2mm' }}>
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>ASHOKA</div>
        <div style={{ marginBottom: '4px' }}>EXPERIENCE COMFORT</div>
        <div style={{ marginBottom: '8px' }}>KITCHEN ORDER TICKET</div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ASHOKA DINING</div>
        <div style={{ marginBottom: '4px' }}>(A Unit Of Ashoka hospitality)</div>
        <div style={{ marginBottom: '4px' }}>Add : Near Hanuman Mandir, Deoria Road</div>
        <div style={{ marginBottom: '4px' }}>Kurnaghat, Gorakhpur - 273008</div>
        <div style={{ marginBottom: '4px' }}>GSTIN : 09ANHPJ7242D2Z1</div>
        <div style={{ marginBottom: '8px' }}>Mob : 6388491244</div>
        <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>KOT #: {order._id?.slice(-6) || 'N/A'}</span>
          <span>Room: {order.tableNo || 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
          <span>Time: {new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Status: {order.status?.toUpperCase() || 'PENDING'}</span>
          <span>Type: IN-ROOM</span>
        </div>
        <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '4px' }}>
          <span style={{ width: '40%' }}>Item</span>
          <span style={{ width: '15%', textAlign: 'center' }}>Qty</span>
          <span style={{ width: '20%', textAlign: 'right' }}>Price</span>
          <span style={{ width: '25%' }}>Notes</span>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        {order.items?.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ width: '40%' }}>{item.itemName || 'Unknown'}</span>
            <span style={{ width: '15%', textAlign: 'center' }}>{item.quantity || 1}</span>
            <span style={{ width: '20%', textAlign: 'right' }}>
              {item.isFree || item.nonChargeable ? 'FREE' : `₹${item.price || 0}`}
            </span>
            <span style={{ width: '25%' }}>{item.note || '-'}</span>
          </div>
        ))}
        <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px' }}>Guest: {order.customerName || order.guestName || 'N/A'}</div>
        <div style={{ marginBottom: '4px' }}>GRC No: {order.grcNo || 'N/A'}</div>
        <div style={{ marginBottom: '4px' }}>Total Items: {order.items?.length || 0}</div>
        <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ marginBottom: '8px' }}>Kitchen Copy - In-Room Dining</div>
        <div style={{ borderBottom: '1px solid #000', marginBottom: '8px' }}></div>
        <div>Printed: {new Date().toLocaleString('en-GB')}</div>
      </div>
    </div>
  );
};

export default InRoomKOT;

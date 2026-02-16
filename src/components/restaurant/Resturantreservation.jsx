import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';

const Resturantreservation = () => {
  const { axios } = useAppContext();
  
  const [formData, setFormData] = useState({
    guestName: '',
    phoneNumber: '',
    email: '',
    partySize: 1,
    reservationDate: '',
    reservationTimeIn: '',
    reservationTimeOut: '',
    tableNo: '',
    specialRequests: '',
    advancePayment: 0
  });

  const [reservations, setReservations] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    date: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [filters]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/restaurant-reservations/all';
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReservations(Array.isArray(data) ? data : data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/restaurant-reservations/create', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast.success('🎉 Reservation created successfully!');
      setFormData({
        guestName: '',
        phoneNumber: '',
        email: '',
        partySize: 1,
        reservationDate: '',
        reservationTimeIn: '',
        reservationTimeOut: '',
        tableNo: '',
        specialRequests: '',
        advancePayment: 0
      });
      setShowForm(false);
      fetchReservations();
    } catch (error) {
      console.error('Error creating reservation:', error);
      showToast.error('Failed to create reservation!');
    }
  };

  const updateStatus = async (reservationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/restaurant-reservations/${reservationId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReservations();
      showToast.success('✅ Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error('Failed to update status!');
    }
  };

  const deleteReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to delete this reservation?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/restaurant-reservations/${reservationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchReservations();
        showToast.success('🗑️ Reservation deleted successfully!');
      } catch (error) {
        console.error('Error deleting reservation:', error);
        showToast.error('Failed to delete reservation!');
      }
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Restaurant Reservation</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-hover transition-colors"
        >
          {showForm ? 'Cancel' : 'New Reservation'}
        </button>
      </div>
      
      {/* Reservation Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-border mb-6">
        <h2 className="text-xl font-semibold text-text mb-4">New Reservation</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text font-medium mb-2">Guest Name *</label>
            <input
              type="text"
              name="guestName"
              value={formData.guestName}
              onChange={handleInputChange}
              required
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Party Size *</label>
            <input
              type="number"
              name="partySize"
              value={formData.partySize}
              onChange={handleInputChange}
              min="1"
              required
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Reservation Date *</label>
            <input
              type="date"
              name="reservationDate"
              value={formData.reservationDate}
              onChange={handleInputChange}
              required
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Check-in Time *</label>
            <input
              type="time"
              name="reservationTimeIn"
              value={formData.reservationTimeIn}
              onChange={handleInputChange}
              required
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Check-out Time *</label>
            <input
              type="time"
              name="reservationTimeOut"
              value={formData.reservationTimeOut}
              onChange={handleInputChange}
              required
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Table Number</label>
            <input
              type="text"
              name="tableNo"
              value={formData.tableNo}
              onChange={handleInputChange}
              placeholder="Optional"
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Advance Payment</label>
            <input
              type="number"
              name="advancePayment"
              value={formData.advancePayment}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-text font-medium mb-2">Special Requests</label>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
              rows="3"
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
              placeholder="Any special requirements..."
            />
          </div>
          
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-hover transition-colors"
            >
              Create Reservation
            </button>
          </div>
        </form>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-border mb-6">
        <h2 className="text-xl font-semibold text-text mb-4">Filter Reservations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text font-medium mb-2">Filter by Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="enquiry">Enquiry</option>
              <option value="reserved">Reserved</option>
              <option value="confirm">Confirm</option>
            </select>
          </div>
          
          <div>
            <label className="block text-text font-medium mb-2">Filter by Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full border border-border rounded-md p-2 text-text focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
      
      {/* Reservations List */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-border">
        <h2 className="text-xl font-semibold text-text mb-4">Current Reservations</h2>
        {reservations.length === 0 ? (
          <p className="text-text">No reservations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-text">Reservation #</th>
                  <th className="text-left p-2 text-text">Guest Name</th>
                  <th className="text-left p-2 text-text">Phone</th>
                  <th className="text-left p-2 text-text">Email</th>
                  <th className="text-left p-2 text-text">Party Size</th>
                  <th className="text-left p-2 text-text">Date & Time</th>
                  <th className="text-left p-2 text-text">Table</th>
                  <th className="text-left p-2 text-text">Advance Payment</th>
                  <th className="text-left p-2 text-text">Status</th>
                  <th className="text-left p-2 text-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation._id} className="border-b border-border">
                    <td className="p-2 text-text">{reservation.reservationNumber}</td>
                    <td className="p-2 text-text">{reservation.guestName}</td>
                    <td className="p-2 text-text">{reservation.phoneNumber}</td>
                    <td className="p-2 text-text">{reservation.email || 'N/A'}</td>
                    <td className="p-2 text-text">{reservation.partySize}</td>
                    <td className="p-2 text-text">
                      {new Date(reservation.reservationDate).toLocaleDateString()} {reservation.reservationTime}
                    </td>
                    <td className="p-2 text-text">{reservation.tableNo || 'TBD'}</td>
                    <td className="p-2 text-text">₹{reservation.advancePayment || 0}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (reservation.advancePayment > 0 ? reservation.status : 'enquiry') === 'enquiry' ? 'bg-accent text-text' :
                        (reservation.advancePayment > 0 ? reservation.status : 'enquiry') === 'reserved' ? 'bg-secondary text-text' :
                        (reservation.advancePayment > 0 ? reservation.status : 'enquiry') === 'confirm' ? 'bg-primary text-white' :
                        'bg-accent text-text'
                      }`}>
                        {reservation.advancePayment > 0 ? reservation.status : 'enquiry'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <select
                          value={reservation.advancePayment > 0 ? reservation.status : 'enquiry'}
                          onChange={(e) => updateStatus(reservation._id, e.target.value)}
                          className="border border-border rounded p-1 text-text text-xs"
                        >
                          <option value="enquiry">Enquiry</option>
                          <option value="reserved">Reserved</option>
                          <option value="confirm">Confirm</option>
                        </select>
                        <button
                          onClick={() => deleteReservation(reservation._id)}
                          className="bg-primary text-white px-2 py-1 rounded text-xs hover:bg-hover transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resturantreservation;

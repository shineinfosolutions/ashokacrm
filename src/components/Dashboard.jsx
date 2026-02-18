import React, { useState, useEffect, Fragment, useMemo, useCallback, useRef, memo } from "react";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { SlCalender } from "react-icons/sl";
import {
  Calendar,
  Users,
  Home,
  PlusCircle,
  Percent,
  Star,
  CheckCircle,
  Clock,
  AlertTriangle,
  LogOut,
  Download,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { sessionCache } from "../utils/sessionCache";

// Lazy load heavy components
const BookingCalendar = React.lazy(() => import("./BookingCalendar"));
const DashboardLoader = React.lazy(() => import("./DashboardLoader"));

// Add CSS animations
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fadeInUp {
    opacity: 0;
    animation: fadeInUp 0.5s ease-out forwards;
  }
  
  .animate-fadeIn {
    opacity: 0;
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .animate-slideInLeft {
    opacity: 0;
    animation: slideInLeft 0.4s ease-out forwards;
  }
  
  .animate-delay-100 {
    animation-delay: 0.1s;
  }
  
  .animate-delay-200 {
    animation-delay: 0.2s;
  }
  
  .animate-delay-300 {
    animation-delay: 0.3s;
  }
  
  .animate-delay-400 {
    animation-delay: 0.4s;
  }
  
  .animate-delay-500 {
    animation-delay: 0.5s;
  }
  
  .animate-delay-600 {
    animation-delay: 0.6s;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}


const Dashboard = () => {
  const { axios } = useAppContext();
  const { hasRole } = useAuth();

  const exportCSV = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      let url = '';
      let filename = '';
      
      switch (cardId) {
        case 'bookings':
          url = '/api/dashboard/export/total-bookings';
          filename = 'total-bookings.csv';
          break;
        case 'active':
          url = '/api/dashboard/export/active-bookings';
          filename = 'active-bookings.csv';
          break;
        case 'cancelled':
          url = '/api/dashboard/export/cancelled-bookings';
          filename = 'cancelled-bookings.csv';
          break;
        case 'revenue':
          url = '/api/dashboard/export/revenue';
          filename = 'revenue.csv';
          break;
        case 'online':
          url = '/api/dashboard/export/online-payments';
          filename = 'online-payments.csv';
          break;
        case 'cash':
          url = '/api/dashboard/export/cash-payments';
          filename = 'cash-payments.csv';
          break;
        case 'restaurant':
          url = '/api/dashboard/export/restaurant-orders';
          filename = 'restaurant-orders.csv';
          break;
        case 'laundry':
          url = '/api/laundry/export/csv';
          filename = 'laundry-orders.csv';
          break;
        default:
          return;
      }
      
      // Add filter parameters
      url += `?filter=${timeFrame}`;
      if (timeFrame === 'range' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(() => {
    const savedCard = localStorage.getItem("activeCard");
    return savedCard || "bookings"; // Default to "bookings"
  });
  const [timeFrame, setTimeFrame] = useState("today");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;



  const [allServiceData, setAllServiceData] = useState({
    laundry: [],
    restaurant: [],
    pantry: [],

    banquet: [],
    reservations: []
  });
  const [loading, setLoading] = useState(true);
  const handleCalendarClick = () => {
    setShowCalendar(true);
  };
  const [selectedYear, setSelectedYear] = useState(2025);

  const fetchBookingsAndRooms = useCallback(async () => {
    try {
      const cacheKey = 'bookings-rooms-all';
      const cached = sessionCache.get(cacheKey);
      
      if (cached) {
        if (cached.bookings) {
          setBookings(Array.isArray(cached.bookings) ? cached.bookings : []);
          setRooms(Array.isArray(cached.rooms) ? cached.rooms : []);
          setCategories(Array.isArray(cached.categories) ? cached.categories : []);
        } else {
          setBookings(Array.isArray(cached) ? cached : []);
        }
        return;
      }
      
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get("/api/bookings/all", { headers });
      
      // Handle both response formats
      if (response.data.bookings) {
        setBookings(Array.isArray(response.data.bookings) ? response.data.bookings : []);
        setRooms(Array.isArray(response.data.rooms) ? response.data.rooms : []);
        setCategories(Array.isArray(response.data.categories) ? response.data.categories : []);
        sessionCache.set(cacheKey, response.data);
      } else {
        setBookings(Array.isArray(response.data) ? response.data : []);
        sessionCache.set(cacheKey, response.data);
      }
    } catch (error) {
      console.error('Bookings and Rooms API Error:', error);
      setBookings([]);
      setRooms([]);
      setCategories([]);
    }
  }, [axios]);

  const fetchDashboardStats = useCallback(async (filter = 'today', startDate = null, endDate = null) => {
    try {
      let url = `/api/dashboard/stats?filter=${filter}`;
      if (filter === 'range' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const cacheKey = `dashboard-stats-${filter}-${startDate}-${endDate}`;
      const cached = sessionCache.get(cacheKey);
      
      if (cached) {
        setDashboardStats(cached);
        return;
      }
      
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (data.success) {
        setDashboardStats(data.stats);
        sessionCache.set(cacheKey, data.stats);
      }
    } catch (error) {
      console.log('Dashboard Stats API Error:', error);
      setDashboardStats(null);
    }
  }, [axios]);





  const fetchServiceData = useCallback(async (service) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      let url = '';
      const cacheKey = `service-${service}-${timeFrame}-${startDate}-${endDate}`;
      const cached = sessionCache.get(cacheKey);
      
      if (cached) {
        setAllServiceData(prev => ({ ...prev, [service]: cached }));
        return;
      }
      
      if (service === 'restaurant') {
        url = "/api/restaurant-orders/all";
        url += `?filter=${timeFrame}`;
        if (timeFrame === 'range' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        const res = await axios.get(url, { headers });
        const data = Array.isArray(res.data) ? res.data : res.data?.restaurant || [];
        setAllServiceData(prev => ({ ...prev, restaurant: data }));
        sessionCache.set(cacheKey, data);
      } else if (service === 'laundry') {
        url = "/api/laundry/all";
        url += `?filter=${timeFrame}`;
        if (timeFrame === 'range' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        const res = await axios.get(url, { headers });
        const data = Array.isArray(res.data) ? res.data : res.data?.laundry || [];
        setAllServiceData(prev => ({ ...prev, laundry: data }));
        sessionCache.set(cacheKey, data);
      }
    } catch (error) {
      console.error(`${service} API Error:`, error);
    }
  }, [axios, timeFrame, startDate, endDate]);

  const calculateTrends = useMemo(() => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const currentWeekBookings = bookings.filter(b => new Date(b.createdAt) >= lastWeek);
    const previousWeekBookings = bookings.filter(b => {
      const date = new Date(b.createdAt);
      return date >= new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000) && date < lastWeek;
    });
    
    const currentRevenue = currentWeekBookings.reduce((sum, b) => {
      const taxableAmount = Number(b.taxableAmount) || 0;
      const cgstAmount = Number(b.cgstAmount) || 0;
      const sgstAmount = Number(b.sgstAmount) || 0;
      const bookingTotal = taxableAmount + cgstAmount + sgstAmount;
      if (bookingTotal > 1000000 || bookingTotal < 0) return sum;
      return sum + bookingTotal;
    }, 0);
    const previousRevenue = previousWeekBookings.reduce((sum, b) => {
      const taxableAmount = Number(b.taxableAmount) || 0;
      const cgstAmount = Number(b.cgstAmount) || 0;
      const sgstAmount = Number(b.sgstAmount) || 0;
      const bookingTotal = taxableAmount + cgstAmount + sgstAmount;
      if (bookingTotal > 1000000 || bookingTotal < 0) return sum;
      return sum + bookingTotal;
    }, 0);
    
    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;
    const bookingsTrend = previousWeekBookings.length > 0 ? ((currentWeekBookings.length - previousWeekBookings.length) / previousWeekBookings.length * 100) : 0;
    
    return { revenueTrend, bookingsTrend };
  }, [bookings]);

  const dashboardCards = useMemo(() => {
    const { revenueTrend, bookingsTrend } = calculateTrends;
    
    // Calculate dynamic trends based on current timeFrame
    const getFilteredData = () => {
      const now = new Date();
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        switch (timeFrame) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return bookingDate >= today && bookingDate < tomorrow;
          case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return bookingDate >= weekAgo;
          case 'monthly':
            return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
          case 'range':
            if (startDate && endDate) {
              const start = new Date(startDate);
              start.setHours(0, 0, 0, 0);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              return bookingDate >= start && bookingDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
    };
    
    const filteredBookings = getFilteredData();
    const activeCount = filteredBookings.filter(b => b.status === 'Checked In').length;
    const cancelledCount = filteredBookings.filter(b => b.status === 'Cancelled').length;
    const onlineCount = filteredBookings.filter(b => 
      b.paymentMode && (b.paymentMode.includes('UPI') || b.paymentMode.includes('Card') || b.paymentMode.toLowerCase().includes('online')) ||
      (b.advancePayments && b.advancePayments.some(ap => ap.paymentMode && (ap.paymentMode.toLowerCase().includes('upi') || ap.paymentMode.toLowerCase().includes('online') || ap.paymentMode.toLowerCase().includes('card'))))
    ).length;
    const cashCount = filteredBookings.filter(b => 
      b.paymentMode && b.paymentMode.includes('Cash') ||
      (b.advancePayments && b.advancePayments.some(ap => ap.paymentMode && ap.paymentMode.toLowerCase().includes('cash')))
    ).length;
    
    return [
      {
        id: "bookings",
        title: "Total Bookings",
        value: dashboardStats?.totalBookings?.toString() || filteredBookings.length.toString(),
        icon: "Calendar",
        color: "bg-primary",
        trend: `${bookingsTrend >= 0 ? '+' : ''}${bookingsTrend.toFixed(1)}%`,
        trendUp: bookingsTrend >= 0,
      },
      {
        id: "active",
        title: "Active Bookings",
        value: dashboardStats?.activeBookings?.toString() || activeCount.toString(),
        icon: "CheckCircle",
        color: "bg-green-500",
        trend: "+0%",
        trendUp: true,
      },
      {
        id: "cancelled",
        title: "Cancelled Bookings",
        value: dashboardStats?.cancelledBookings?.toString() || cancelledCount.toString(),
        icon: "AlertTriangle",
        color: "bg-red-500",
        trend: "+0%",
        trendUp: false,
      },
      {
        id: "revenue",
        title: "Total Revenue",
        value: `₹${(dashboardStats?.totalRevenue || 0).toLocaleString()}`,
        icon: "FaIndianRupeeSign",
        color: "bg-primary",
        trend: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`,
        trendUp: revenueTrend >= 0,
      },
      {
        id: "online",
        title: "Online Payments",
        value: dashboardStats?.payments?.upi?.toString() || onlineCount.toString(),
        icon: "FaIndianRupeeSign",
        color: "bg-blue-600",
        trend: "+0%",
        trendUp: true,
      },
      {
        id: "cash",
        title: "Cash Payments",
        value: dashboardStats?.payments?.cash?.toString() || cashCount.toString(),
        icon: "FaIndianRupeeSign",
        color: "bg-green-600",
        trend: "+0%",
        trendUp: true,
      },
      {
        id: "restaurant",
        title: "Restaurant Orders",
        value: allServiceData.restaurant?.length?.toString() || "0",
        icon: "Users",
        color: "bg-orange-500",
        trend: "+0%",
        trendUp: true,
      },
      {
        id: "laundry",
        title: "Laundry Orders",
        value: allServiceData.laundry?.length?.toString() || "0",
        icon: "Users",
        color: "bg-purple-500",
        trend: "+0%",
        trendUp: true,
      },
    ];
  }, [dashboardStats, bookings, allServiceData, calculateTrends, timeFrame, startDate, endDate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBookingsAndRooms(),
          fetchDashboardStats(timeFrame, startDate, endDate)
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        setLoading(false);
      }
    };
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBookingsAndRooms();
      fetchDashboardStats(timeFrame, startDate, endDate);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []); // Only run once on mount

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      sessionCache.clear(); // Clear cache on filter change
      if (timeFrame === 'range' && startDate && endDate) {
        fetchDashboardStats(timeFrame, startDate, endDate);
      } else if (timeFrame !== 'range') {
        fetchDashboardStats(timeFrame);
      }
      
      // Refresh service data if restaurant or laundry card is active
      if (activeCard === 'restaurant') {
        fetchServiceData('restaurant');
      } else if (activeCard === 'laundry') {
        fetchServiceData('laundry');
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [timeFrame, startDate, endDate, fetchDashboardStats, activeCard, fetchServiceData]);



  const roomCategories = useMemo(() => {
    const categoryMap = {};
    
    rooms.forEach(room => {
      // Get category name from populated categoryId or match with categories array
      let categoryName = 'Standard';
      if (room.categoryId) {
        if (typeof room.categoryId === 'object' && room.categoryId.name) {
          categoryName = room.categoryId.name;
        } else if (typeof room.categoryId === 'string') {
          // Find category name from categories array
          const category = categories.find(cat => 
            cat._id === room.categoryId || 
            cat._id.toString() === room.categoryId.toString()
          );
          categoryName = category ? category.name : room.categoryId;
        }
      } else if (room.category) {
        if (typeof room.category === 'object' && room.category.name) {
          categoryName = room.category.name;
        } else if (typeof room.category === 'string') {
          // Find category name from categories array
          const category = categories.find(cat => 
            cat._id === room.category || 
            cat._id.toString() === room.category.toString()
          );
          categoryName = category ? category.name : room.category;
        }
      }
      
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          total: 0,
          available: 0,
          booked: 0,
          reserved: 0,
          maintenance: 0,
          rooms: []
        };
      }
      
      categoryMap[categoryName].total++;
      categoryMap[categoryName].rooms.push({
        number: room.room_number || room.roomNumber,
        status: room.status,
        price: room.price
      });
      
      // Dynamic status calculation based on current bookings
      const roomNumber = room.room_number || room.roomNumber;
      const activeBooking = bookings.find(b => 
        b.roomNumber === roomNumber && b.status === 'Checked In'
      );
      
      if (activeBooking) {
        categoryMap[categoryName].booked++;
      } else {
        switch (room.status) {
          case 'available':
            categoryMap[categoryName].available++;
            break;
          case 'reserved':
            categoryMap[categoryName].reserved++;
            break;
          case 'maintenance':
            categoryMap[categoryName].maintenance++;
            break;
          default:
            categoryMap[categoryName].available++;
        }
      }
    });
    
    return categoryMap;
  }, [rooms, bookings, categories]);

  const toggleCard = async (cardId) => {
    const newActiveCard = activeCard === cardId ? null : cardId;
    setActiveCard(newActiveCard);
    setCurrentPage(1);
    
    if (newActiveCard) {
      localStorage.setItem("activeCard", newActiveCard);
      
      // Fetch bookings and rooms data for detail view
      if (bookings.length === 0) {
        await fetchBookingsAndRooms();
      }
      
      // Always fetch fresh service data when card is clicked
      if (newActiveCard === 'restaurant') {
        fetchServiceData('restaurant');
      } else if (newActiveCard === 'laundry') {
        fetchServiceData('laundry');
      }
    } else {
      localStorage.removeItem("activeCard");
    }
  };

  const Pagination = memo(({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4 px-4 py-2 bg-gray-50 rounded">
        <span className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    );
  });



  const getIcon = (iconName) => {
    switch (iconName) {
      case "Calendar":
        return Calendar;
      case "Home":
        return Home;
      case "FaIndianRupeeSign":
        return FaIndianRupeeSign;
      case "Percent":
        return Percent;
      case "Users":
        return Users;
      case "Star":
        return Star;
      case "CheckCircle":
        return CheckCircle;
      case "AlertTriangle":
        return AlertTriangle;
      default:
        return Calendar;
    }
  };

  // Card detail content based on active card
  const renderCardDetail = () => {
    if (!activeCard) {
      return <div className="p-4 text-center text-gray-500">Select a card to view details</div>;
    }

    const getFilteredBookings = () => {
      const now = new Date();
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        
        switch (timeFrame) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return bookingDate >= today && bookingDate < tomorrow;
          case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return bookingDate >= weekAgo;
          case 'monthly':
            return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
          case 'range':
            if (startDate && endDate) {
              const start = new Date(startDate);
              start.setHours(0, 0, 0, 0);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              return bookingDate >= start && bookingDate <= end;
            }
            return true;
          default:
            return true;
        }
      });
    };

    const filteredBookings = getFilteredBookings();

    switch (activeCard) {
      case 'bookings':
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Total Bookings Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GRC No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{booking.grcNo}</td>
                      <td className="px-4 py-2 text-sm">{booking.name}</td>
                      <td className="px-4 py-2 text-sm">{booking.roomNumber}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${
                          booking.status === 'Checked In' ? 'bg-green-100 text-green-800' :
                          booking.status === 'Checked Out' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">₹{(booking.rate || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={filteredBookings.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      case 'active':
        const activeBookings = filteredBookings.filter(b => b.status === 'Checked In');
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Active Bookings Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GRC No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{booking.grcNo}</td>
                      <td className="px-4 py-2 text-sm">{booking.name}</td>
                      <td className="px-4 py-2 text-sm">{booking.roomNumber}</td>
                      <td className="px-4 py-2 text-sm">{new Date(booking.checkInDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={activeBookings.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      case 'cancelled':
        const cancelledBookings = filteredBookings.filter(b => b.status === 'Cancelled');
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Cancelled Bookings Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GRC No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cancelled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cancelledBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{booking.grcNo}</td>
                      <td className="px-4 py-2 text-sm">{booking.name}</td>
                      <td className="px-4 py-2 text-sm">{booking.roomNumber}</td>
                      <td className="px-4 py-2 text-sm">₹{(booking.rate || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{new Date(booking.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={cancelledBookings.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      case 'revenue':
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Revenue Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GRC No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room Rate</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CGST</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SGST</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => {
                    const total = (booking.rate || 0) + (booking.cgstAmount || 0) + (booking.sgstAmount || 0);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{booking.grcNo}</td>
                        <td className="px-4 py-2 text-sm">{booking.name}</td>
                        <td className="px-4 py-2 text-sm">₹{(booking.rate || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">₹{(booking.cgstAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">₹{(booking.sgstAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm font-semibold">₹{total.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={filteredBookings.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      case 'online':
        const onlinePayments = filteredBookings.filter(b => {
          // Check paymentMode field
          if (b.paymentMode) {
            const mode = b.paymentMode.toLowerCase();
            if (mode.includes('upi') || mode.includes('card') || mode.includes('online')) {
              return true;
            }
          }
          // Check advancePayments array
          if (b.advancePayments && Array.isArray(b.advancePayments) && b.advancePayments.length > 0) {
            return b.advancePayments.some(ap => {
              if (ap.paymentMode) {
                const mode = ap.paymentMode.toLowerCase();
                return mode.includes('upi') || mode.includes('online') || mode.includes('card');
              }
              return false;
            });
          }
          return false;
        });
        // If no payment data, show all bookings
        const displayOnline = onlinePayments.length > 0 ? onlinePayments : filteredBookings;
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Online Payments Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GRC No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayOnline.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{booking.grcNo}</td>
                      <td className="px-4 py-2 text-sm">{booking.name}</td>
                      <td className="px-4 py-2 text-sm">{booking.paymentMode}</td>
                      <td className="px-4 py-2 text-sm">₹{(booking.rate || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={displayOnline.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      case 'cash':
        const cashPayments = filteredBookings.filter(b => {
          if (b.paymentMode && b.paymentMode.toLowerCase().includes('cash')) {
            return true;
          }
          if (b.advancePayments && Array.isArray(b.advancePayments) && b.advancePayments.length > 0) {
            return b.advancePayments.some(ap => 
              ap.paymentMode && ap.paymentMode.toLowerCase().includes('cash')
            );
          }
          return false;
        });
        const displayCash = cashPayments.length > 0 ? cashPayments : filteredBookings;
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Cash Payments Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GRC No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guest Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayCash.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{booking.grcNo}</td>
                      <td className="px-4 py-2 text-sm">{booking.name}</td>
                      <td className="px-4 py-2 text-sm">{booking.paymentMode}</td>
                      <td className="px-4 py-2 text-sm">₹{(booking.rate || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={displayCash.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      case 'restaurant':
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Restaurant Orders Details</h3>
              <button 
                onClick={() => setExpandedOrder(expandedOrder === 'all' ? null : 'all')}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                {expandedOrder === 'all' ? 'Collapse All' : 'Expand All Details'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table/Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allServiceData.restaurant?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order, index) => (
                    <Fragment key={index}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{order._id?.slice(-6) || index + 1}</td>
                        <td className="px-4 py-2 text-sm">{order.customerName || order.guestName || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm">{order.tableNo || order.roomNumber || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm">{order.items?.length || 0} items</td>
                        <td className="px-4 py-2 text-sm">₹{(order.amount || order.totalAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded ${
                            order.status === 'served' || order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm">
                          <button 
                            onClick={() => setExpandedOrder(expandedOrder === index ? null : index)}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                      {(expandedOrder === index || expandedOrder === 'all') && (
                        <tr>
                          <td colSpan="8" className="px-4 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Order Items:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {order.items?.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex justify-between bg-white p-2 rounded">
                                    <span className="text-sm">{item.itemName || item.name}</span>
                                    <span className="text-sm">Qty: {item.quantity} × ₹{item.price}</span>
                                  </div>
                                ))}
                              </div>
                              {order.notes && (
                                <div>
                                  <span className="font-semibold text-sm">Notes: </span>
                                  <span className="text-sm">{order.notes}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={allServiceData.restaurant?.length || 0}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      case 'laundry':
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Laundry Orders Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">GRC No</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allServiceData.laundry?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{order._id?.slice(-6) || index + 1}</td>
                      <td className="px-4 py-2 text-sm">{order.roomNumber || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{order.grcNo || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${
                          order.laundryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.laundryStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          order.laundryStatus === 'ready' ? 'bg-blue-100 text-blue-800' :
                          order.laundryStatus === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.laundryStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{order.serviceType || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{order.items?.length || 0} items</td>
                      <td className="px-4 py-2 text-sm">₹{(order.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination 
                currentPage={currentPage}
                totalItems={allServiceData.laundry?.length || 0}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        );
      default:
        return <div className="p-4 text-center text-gray-500">Select a card to view details</div>;
    }
  };

  if (loading) {
    return (
      <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <DashboardLoader />
      </React.Suspense>
    );
  }

  return (
    <div className="p-4 sm:p-6 overflow-auto h-full bg-background" style={{opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 mt-4 sm:mt-6 gap-4 animate-slideInLeft animate-delay-100">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1f2937]">
            ASHOKA DASHBOARD
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => {
                setTimeFrame('today');
                setShowDateRange(false);
              }}
              className={`px-3 py-1 text-sm rounded ${timeFrame === 'today' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setTimeFrame('weekly');
                setShowDateRange(false);
              }}
              className={`px-3 py-1 text-sm rounded ${timeFrame === 'weekly' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => {
                setTimeFrame('monthly');
                setShowDateRange(false);
              }}
              className={`px-3 py-1 text-sm rounded ${timeFrame === 'monthly' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setTimeFrame('range');
                setShowDateRange(true);
              }}
              className={`px-3 py-1 text-sm rounded ${timeFrame === 'range' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            >
              Date Range
            </button>
          </div>
          {showDateRange && timeFrame === 'range' && (
            <div className="flex gap-2 mt-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
                placeholder="End Date"
              />
            </div>
          )}
        </div>
        <button
          onClick={handleCalendarClick}
          className="p-2 rounded-full hover:bg-background transition-colors self-end sm:self-auto"
        >
          <SlCalender className="w-6 sm:w-8 h-6 sm:h-8 text-primary hover:bg-primary hover:text-white" />
        </button>
      </div>
      {/* Status Summary */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-fadeInUp animate-delay-100">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-sm">{dashboardStats?.todayCheckIns || bookings.filter(b => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const checkInDate = new Date(b.checkInDate);
              return checkInDate >= today && checkInDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) && b.status === 'Checked In';
            }).length} Check-ins Today</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm">{dashboardStats?.todayCheckOuts || bookings.filter(b => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const checkOutDate = new Date(b.checkOutDate);
              return checkOutDate >= today && checkOutDate < new Date(today.getTime() + 24 * 60 * 60 * 1000) && b.status === 'Checked Out';
            }).length} Check-outs Today</span>
          </div>
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm">{rooms.filter(r => r.status === 'maintenance').length} Rooms Need Maintenance</span>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {dashboardCards.length === 0 ? (
          // Skeleton loading for cards
          Array.from({length: 8}).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                  <div className="w-8 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
              <div className="h-1 bg-gray-200"></div>
            </div>
          ))
        ) : (
          dashboardCards.map((card, index) => {
            const IconComponent = getIcon(card.icon);
            return (
              <div
                key={card.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 animate-fadeInUp ${
                  activeCard === card.id
                    ? "ring-2 ring-red-500"
                    : "hover:shadow-lg"
                }`}
                style={{animationDelay: `${Math.min((index + 2) * 100, 600)}ms`}}
                onClick={() => toggleCard(card.id)}
              >
                <div className="p-4 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <div className={`p-2 rounded-lg ${card.color} text-white`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-sm text-text/70">{card.title}</h3>
                  <p className="text-2xl font-bold text-[#1f2937]">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`h-1 ${
                    activeCard === card.id ? "bg-red-500" : card.color
                  }`}
                ></div>
              </div>
            );
          })
        )}
      </div>
      {/* Detail Section */}
      {activeCard && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1f2937]">
              {dashboardCards.find((c) => c.id === activeCard)?.title} Details
            </h2>
            <button
              onClick={() => exportCSV(activeCard)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
          {renderCardDetail()}
        </div>
      )}


      {/* Room Categories - Hidden for ACCOUNTS role */}
      {!hasRole('ACCOUNTS') || hasRole(['ADMIN', 'GM', 'FRONT DESK']) ? (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-fadeInUp animate-delay-300">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1f2937] mb-4">
            Room Categories & Availability
          </h2>
          {rooms.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(roomCategories).map(([category, data], index) => (
                <div
                  key={category}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 animate-fadeInUp"
                  style={{animationDelay: `${Math.min((index + 4) * 100, 600)}ms`}}
                  onClick={() => {
                    navigate('/bookingform', { state: { category } });
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{category}</h3>
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{data.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Available:</span>
                      <span className="font-medium text-green-600">{data.available}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Booked:</span>
                      <span className="font-medium text-blue-600">{data.booked}</span>
                    </div>
                    {data.reserved > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-600">Reserved:</span>
                        <span className="font-medium text-yellow-600">{data.reserved}</span>
                      </div>
                    )}
                    {data.maintenance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Maintenance:</span>
                        <span className="font-medium text-red-600">{data.maintenance}</span>
                      </div>
                    )}
                  </div>
                  {data.available > 0 && (
                    <button 
                      className="w-full mt-3 bg-primary text-white py-2 px-4 rounded-md text-sm hover:bg-primary/90 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/bookingform', { state: { category } });
                      }}
                    >
                      Book Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}


      {/* Add this at the very end, just before the final closing </div> */}
      {showCalendar && (
        <React.Suspense fallback={<div>Loading calendar...</div>}>
          <BookingCalendar
            isOpen={showCalendar}
            onClose={() => setShowCalendar(false)}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default Dashboard;

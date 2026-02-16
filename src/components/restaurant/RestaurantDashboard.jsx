
import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, CalendarCheck, DollarSign, Utensils, Table, ListChecks, 
    TrendingUp, Trash2, Soup, Clock, CheckCircle, BarChart3
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ViewKOTModal from './ViewKOTModal.jsx';
import { motion } from 'framer-motion';

// --- Theme Colors (For consistent look) ---
const THEME_ACCENT = '#CFA85A'; // Gold/Khaki
const PRIMARY_COLOR = '#b39b5a';

// --- Reusable Stat Card Component (FIXED LOGIC) ---
const StatCard = ({ title, value, change, icon: Icon, color, isNegativeBetter = false }) => {
    
    // 1. Determine the raw change direction (positive or negative)
    const isPositiveChange = change >= 0;

    // 2. Determine if the change is "Good" for the metric (color)
    let isGoodChange = isPositiveChange;
    if (isNegativeBetter) {
        isGoodChange = !isPositiveChange; // If negative is better (e.g., pending orders decrease)
    }

    // 3. Set color based on the GOAL (isGoodChange)
    const changeColor = isGoodChange ? 'text-green-600' : 'text-red-600';

    // 4. Set the actual visual indicator direction based on the RAW CHANGE
    const TrendIcon = TrendingUp;
    const rotationClass = isPositiveChange ? 'rotate-0' : 'rotate-180'; 

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-shadow duration-300 hover:shadow-xl">
            <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-gray-500">{title}</p>
                <div className={`p-2 rounded-lg text-white shadow-md`} style={{ backgroundColor: color }}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{value}</p>
            <div className="flex items-center mt-3">
                <TrendIcon className={`h-4 w-4 mr-1 ${changeColor} ${rotationClass}`} />
                <span className={`text-sm font-bold ${changeColor}`}>
                    {Math.abs(change)}%
                </span>
                <span className="ml-2 text-xs text-gray-500">vs last week</span>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------
// --- 1. Live Kitchen Status Widget (UI IMPROVEMENT: Better Background Contrast) ---
// ----------------------------------------------------------------------
const KitchenStatusWidget = ({ kotData, loading }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    
    const kitchenStats = {
        pending: kotData.filter(kot => kot.status === 'pending').length,
        preparing: kotData.filter(kot => kot.status === 'preparing' || kot.status === 'in-progress').length,
        ready: kotData.filter(kot => kot.status === 'ready').length
    };
    
    const kitchenData = [
        { status: 'Pending (New)', count: loading ? '...' : kitchenStats.pending, icon: Clock, color: '#ef4444', accentBg: 'bg-red-50' }, // Tailwind colors converted to hex/light bg
        { status: 'In Preparation', count: loading ? '...' : kitchenStats.preparing, icon: Soup, color: '#f59e0b', accentBg: 'bg-yellow-50' },
        { status: 'Ready to Serve', count: loading ? '...' : kitchenStats.ready, icon: CheckCircle, color: '#10b981', accentBg: 'bg-green-50' },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between items-center">
                Live Kitchen Status
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                    View KOTs
                </button>
            </h3>
            <div className="flex flex-col space-y-3">
                {kitchenData.map((item) => (
                    <div 
                        key={item.status} 
                        className={`p-3 rounded-lg flex justify-between items-center border-l-4 ${item.accentBg} transition-shadow hover:shadow-md`}
                        style={{ borderColor: item.color }} 
                    >
                        <div className="flex items-center">
                            <item.icon className={`h-5 w-5 mr-3`} style={{ color: item.color }} />
                            <span className="font-medium text-gray-700">{item.status}</span>
                        </div>
                        <span className={`text-2xl font-extrabold p-1 rounded`} style={{ color: item.color }}>
                            {item.count}
                        </span>
                    </div>
                ))}
            </div>

            <ViewKOTModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                kotData={kotData}
            />
        </div>
    );
};

// ----------------------------------------------------------------------
// --- 2. Enhanced Table Availability Widget ---
// ----------------------------------------------------------------------
const TableAvailabilityWidget = ({ tables, loading }) => {
    const tableStats = {
        available: tables.filter(t => t.status === 'available').length,
        occupied: tables.filter(t => t.status === 'occupied').length,
        cleaning: tables.filter(t => t.status === 'cleaning').length,
        total: tables.length
    };

    // Group tables by capacity for better organization
    const tablesByCapacity = tables.reduce((acc, table) => {
        const capacity = table.capacity || 0;
        if (!acc[capacity]) acc[capacity] = [];
        acc[capacity].push(table);
        return acc;
    }, {});

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="bg-emerald-50 p-2 rounded-lg mr-2">
                        <Table className="h-5 w-5 text-emerald-600" />
                    </span>
                    Table Status
                    <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        {loading ? '...' : tableStats.total} Tables
                    </span>
                </h3>
                <div className="flex space-x-2">
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
                        View Map
                    </button>
                </div>
            </div>

            {/* Status Overview Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Available</span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            {loading ? '...' : tableStats.available}
                        </span>
                    </div>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-800">Occupied</span>
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            {loading ? '...' : tableStats.occupied}
                        </span>
                    </div>
                </div>
                <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-800">Cleaning</span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                            {loading ? '...' : tableStats.cleaning}
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Table List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-gray-600">Table Details</h4>
                    <div className="flex space-x-1">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">●&nbsp;Available</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">●&nbsp;Occupied</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">●&nbsp;Cleaning</span>
                    </div>
                </div>
                
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="animate-pulse space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                            ))}
                        </div>
                    ) : (
                        Object.entries(tablesByCapacity)
                            .sort(([capA], [capB]) => parseInt(capA) - parseInt(capB))
                            .map(([capacity, capacityTables]) => (
                                <div key={capacity} className="mb-4">
                                    <h5 className="text-xs font-medium text-gray-500 mb-2">
                                        {capacity} Seater Tables
                                    </h5>
                                    <div className="grid grid-cols-4 gap-2">
                                        {capacityTables.map(table => (
                                            <div 
                                                key={table._id}
                                                className={`p-2 rounded-lg border text-center transition-all hover:shadow-md cursor-pointer
                                                    ${table.status === 'available' 
                                                        ? 'bg-green-50 border-green-200 hover:border-green-300' 
                                                        : table.status === 'occupied'
                                                        ? 'bg-red-50 border-red-200 hover:border-red-300'
                                                        : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'}`}
                                            >
                                                <span className={`text-sm font-medium
                                                    ${table.status === 'available' 
                                                        ? 'text-green-800' 
                                                        : table.status === 'occupied'
                                                        ? 'text-red-800'
                                                        : 'text-yellow-800'}`}
                                                >
                                                    T{table.tableNumber}
                                                </span>
                                                {table.currentOrder && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Order #{table.currentOrder.slice(-4)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex justify-end space-x-2">
                <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    Manage Tables
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    View History
                </button>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------
// --- 3. Wastage Status Widget (No major changes needed, logic is clear) ---
// ----------------------------------------------------------------------
const WastageStatusWidget = ({ wastageData, loading }) => {
    const todayWastage = wastageData.length > 0 ? wastageData[0] : null;
    const wastagePercentage = todayWastage?.percentage || 0;
    const wastageAmount = todayWastage?.amount || 0;
    
    const getWastageStatus = (percentage) => {
        if (percentage <= 3) return { status: 'Excellent', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800' };
        if (percentage <= 5) return { status: 'Good', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
        if (percentage <= 8) return { status: 'Warning', color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
        return { status: 'Critical', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    };
    
    const statusInfo = getWastageStatus(wastagePercentage);
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-600" />
                Today's Wastage Status
            </h3>
            <div className="space-y-4">
                <div className={`p-4 rounded-lg ${statusInfo.bgColor} border-l-4`} style={{ borderLeftColor: statusInfo.color }}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusInfo.textColor}`} style={{ backgroundColor: statusInfo.color + '20' }}>
                            {loading ? '...' : statusInfo.status}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Percentage</span>
                        <span className="text-2xl font-bold text-gray-800">{loading ? '...' : wastagePercentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount</span>
                        <span className="text-xl font-semibold text-gray-800">₹{loading ? '...' : wastageAmount}</span>
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">Wastage Guidelines</h4>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-green-600">• Excellent (≤3%)</span>
                            <span className="text-gray-500">Target range</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-600">• Good (4-5%)</span>
                            <span className="text-gray-500">Acceptable</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-yellow-600">• Warning (6-8%)</span>
                            <span className="text-gray-500">Needs attention</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-600">• Critical (8%)</span>
                            <span className="text-gray-500">Immediate action</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- External Static Data for Readability ---
const QUICK_ACCESS_LINKS = [
    { 
        name: "Create Order", 
        icon: ShoppingCart, 
        link: "/book-table", 
        color: "#22c55e",
        description: "Create a new food order",
        shortcut: "Ctrl+N" 
    },
    { 
        name: "All Orders", 
        icon: ListChecks, 
        link: "/resturant/all-orders", 
        color: "#3b82f6",
        description: "View and manage orders",
        shortcut: "Ctrl+O"
    },
    { 
        name: "Reservation", 
        icon: CalendarCheck, 
        link: "/resturant/reservation", 
        color: "#8b5cf6",
        description: "Manage table bookings",
        shortcut: "Ctrl+R"
    },
    { 
        name: "Billing", 
        icon: DollarSign, 
        link: "/billing", 
        color: "#f59e0b",
        description: "Process payments",
        shortcut: "Ctrl+B"
    },
    { 
        name: "Table Status", 
        icon: Table, 
        link: "/table", 
        color: "#ef4444",
        description: "View table availability",
        shortcut: "Ctrl+T"
    },
    { 
        name: "Kitchen View", 
        icon: Utensils, 
        link: "/kitchen", 
        color: "#06b6d4",
        description: "Monitor kitchen orders",
        shortcut: "Ctrl+K"
    }
];


// ----------------------------------------------------------------------
// --- Main Dashboard Component ---
// ----------------------------------------------------------------------
const DashboardContent = () => {
    const { axios } = useAppContext();
    const [stats, setStats] = useState({
        todayOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        avgPrepTime: 0,
        availableTables: 0,
        totalTables: 0,
        revenueChange: 0,
        ordersChange: 0,
        pendingChange: 0,
        tablesChange: 0
    });
    const [orders, setOrders] = useState([]);
    const [tables, setTables] = useState([]);
    const [kotData, setKotData] = useState([]);
    const [wastageData, setWastageData] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    // Handler functions for order actions
    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setShowViewModal(true);
    };

    const handleUpdateOrder = (order) => {
        setSelectedOrder(order);
        setShowUpdateModal(true);
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/restaurant-orders/update/${orderId}`, 
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Update local state
            setOrders(prev => prev.map(order => 
                order._id === orderId ? { ...order, status: newStatus } : order
            ));
            setShowUpdateModal(false);
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    // --- (The original fetchDashboardData logic remains unchanged) ---
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch dashboard stats with percentage changes
            let dashboardStats = {
                todayOrders: 0,
                totalRevenue: 0,
                pendingOrders: 0,
                availableTables: 0,
                totalTables: 0,
                revenueChange: 0,
                ordersChange: 0,
                pendingChange: 0,
                tablesChange: 0
            };
            
            try {
                const statsRes = await axios.get('/api/restaurant/dashboard-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (statsRes.data) {
                    dashboardStats = { ...dashboardStats, ...statsRes.data };
                }
            } catch (error) {
                console.log('Dashboard stats API failed, calculating manually');
            }
            
            // Fetch orders
            const ordersRes = await axios.get('/api/restaurant-orders/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
            setOrders(ordersData);
            
            // Fetch KOT data
            try {
                const kotRes = await axios.get('/api/kot/all', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const kotDataArray = Array.isArray(kotRes.data) ? kotRes.data : kotRes.data?.kots || kotRes.data?.data || [];
                setKotData(kotDataArray);
            } catch (error) {
                console.log('KOT API failed, using mock data');
                setKotData([
                    { _id: '1', status: 'pending', tableNumber: '1' },
                    { _id: '2', status: 'preparing', tableNumber: '2' },
                    { _id: '3', status: 'ready', tableNumber: '3' },
                    { _id: '4', status: 'pending', tableNumber: '4' },
                    { _id: '5', status: 'preparing', tableNumber: '5' }
                ]);
            }
            
            // Fetch wastage data - try official public API first, then fall back to local relative endpoint
            try {
                const wastageUrl = 'https://ashoka-api.shineinfosolutions.in/api/wastage';
                let wastageRes;
                try {
                    // Try external (absolute) URL first
                    wastageRes = await axios.get(wastageUrl, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (externalErr) {
                    // If external fails (network/CORS), try the relative path used by the app
                    try {
                        wastageRes = await axios.get('/api/wastage', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    } catch (relativeErr) {
                        // Re-throw so outer catch will set mock data
                        throw relativeErr;
                    }
                }

                const wastageArray = Array.isArray(wastageRes.data)
                    ? wastageRes.data
                    : wastageRes.data?.wastage || wastageRes.data?.data || [];
                setWastageData(wastageArray);
            } catch (error) {
                console.log('Wastage API failed (external+relative), using mock data', error);
                setWastageData([
                    { _id: '1', date: new Date(), percentage: 8, amount: 500 },
                    { _id: '2', date: new Date(Date.now() - 86400000), percentage: 6, amount: 400 },
                    { _id: '3', date: new Date(Date.now() - 172800000), percentage: 7, amount: 450 }
                ]);
            }
            
            // Fetch reservations
            try {
                const reservationsRes = await axios.get('/api/restaurant-reservations/all', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const reservationsArray = Array.isArray(reservationsRes.data) ? reservationsRes.data : reservationsRes.data?.reservations || reservationsRes.data?.data || [];

                setReservations(reservationsArray);
            } catch (error) {
                console.log('Reservations API failed, using mock data');
                setReservations([
                    { _id: '1', tableNumber: '7', guests: 4, time: '7:30 PM', date: new Date() },
                    { _id: '2', tableNumber: '2', guests: 2, time: '8:00 PM', date: new Date() },
                    { _id: '3', tableNumber: '10', guests: 6, time: '9:00 PM', date: new Date() }
                ]);
            }
            
            // Fetch tables - try multiple endpoints
            let tablesData = [];
            try {
                const tablesRes = await axios.get('/api/restaurant/tables', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                tablesData = Array.isArray(tablesRes.data) ? tablesRes.data : tablesRes.data?.tables || tablesRes.data?.data || [];
            } catch (error) {
                console.log('First endpoint failed, trying alternative...');
                try {
                    const tablesRes = await axios.get('/api/tables/all', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    tablesData = Array.isArray(tablesRes.data) ? tablesRes.data : tablesRes.data?.tables || tablesRes.data?.data || [];
                } catch (error2) {
                    console.log('Second endpoint failed, using mock data');
                }
            }
            
            // Use mock data if no tables found
            if (tablesData.length === 0) {
                tablesData = [
                    { _id: '1', tableNumber: '1', status: 'available', capacity: 4 },
                    { _id: '2', tableNumber: '2', status: 'occupied', capacity: 2 },
                    { _id: '3', tableNumber: '3', status: 'cleaning', capacity: 6 },
                    { _id: '4', tableNumber: '4', status: 'available', capacity: 4 },
                    { _id: '5', tableNumber: '5', status: 'available', capacity: 8 },
                    { _id: '6', tableNumber: '6', status: 'occupied', capacity: 2 },
                    { _id: '7', tableNumber: '7', status: 'available', capacity: 4 },
                    { _id: '8', tableNumber: '8', status: 'cleaning', capacity: 6 }
                ];
            }
            
            setTables(tablesData);
            
            // Calculate stats
            const today = new Date().toDateString();
            const todayOrders = ordersData.filter(order => {
                const orderDate = new Date(order.createdAt || order.date);
                return orderDate.toDateString() === today;
            });
            const todaysRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || order.amount || order.total || 0), 0);
            const pendingOrders = ordersData.filter(order => 
                order.status === 'pending' || order.status === 'preparing' || order.status === 'in-progress' ||
                order.status === 'new' || order.status === 'received' || order.status === 'confirmed'
            );
            
            // Update pending orders count using the status endpoint
            const pendingOrdersCount = pendingOrders.length;
            

            const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || order.amount || order.total || 0), 0);
            
            // Calculate available tables (exclude occupied and reserved tables)
            const currentReservations = reservations.filter(r => {
                const now = new Date();
                const reservationTime = new Date(r.date + ' ' + r.time);
                const endTime = new Date(reservationTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
                return now >= reservationTime && now <= endTime && reservationTime.toDateString() === now.toDateString();
            });
            const reservedTableNumbers = currentReservations.map(r => r.tableNumber);
            const availableTables = tablesData.filter(table => 
                table.status === 'available' && !reservedTableNumbers.includes(table.tableNumber)
            ).length;
            

            

            
            // Update stats with calculated values if API didn't provide them
            if (dashboardStats.todayOrders === 0) {
                dashboardStats.todayOrders = todayOrders.length;
            }
            if (dashboardStats.totalRevenue === 0) {
                dashboardStats.totalRevenue = todaysRevenue;
            }
            if (dashboardStats.pendingOrders === 0) {
                dashboardStats.pendingOrders = pendingOrdersCount;
            }
            if (dashboardStats.availableTables === 0) {
                dashboardStats.availableTables = availableTables;
            }
            if (dashboardStats.totalTables === 0) {
                dashboardStats.totalTables = tablesData.length;
            }
            

            
            setStats(dashboardStats);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Set mock data on error
            setTables([
                { _id: '1', tableNumber: '1', status: 'available', capacity: 4 },
                { _id: '2', tableNumber: '2', status: 'occupied', capacity: 2 },
                { _id: '3', tableNumber: '3', status: 'cleaning', capacity: 6 },
                { _id: '4', tableNumber: '4', status: 'available', capacity: 4 },
                { _id: '5', tableNumber: '5', status: 'available', capacity: 8 }
            ]);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <motion.div 
            key="restaurant-dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="p-6 bg-gradient-to-br from-[#f8f7f4] to-[#e9e1cc] min-h-screen"
        >
            {/* Simple Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Utensils className="h-8 w-8 mr-3 text-[#b39b5a]" />
                    Restaurant Dashboard
                </h1>
            </div>
            
            {/* Enhanced Quick Access Section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="bg-[#b39b5a]/10 p-2 rounded-lg mr-2">
                            <ListChecks className="h-5 w-5 text-[#b39b5a]" />
                        </span>
                        Quick Actions
                    </div>
                    <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                        <span className="mr-1">View All</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {QUICK_ACCESS_LINKS.map((item) => (
                        <a 
                            key={item.name}
                            href={item.link} 
                            className="group relative bg-white p-6 rounded-xl shadow-sm border border-gray-100
                                transition-all duration-300 hover:shadow-lg hover:border-gray-200
                                flex flex-col items-center justify-center"
                        >
                            {/* Icon Container */}
                            <div 
                                className="w-12 h-12 flex items-center justify-center rounded-lg mb-3 transition-all
                                    group-hover:scale-110"
                                style={{ 
                                    backgroundColor: `${item.color}15`,
                                    color: item.color
                                }}
                            >
                                <item.icon className="h-6 w-6" />
                            </div>

                            {/* Title */}
                            <span className="text-sm font-semibold text-gray-700 text-center mb-1">
                                {item.name}
                            </span>

                            {/* Description - Hidden by default, shown on hover */}
                            <p className="text-xs text-gray-500 text-center hidden group-hover:block absolute
                                bottom-2 left-0 right-0 px-2 transition-all opacity-0 group-hover:opacity-100">
                                {item.description}
                            </p>



                            {/* Hover Indicator */}
                            <div 
                                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 rounded-t
                                    transition-all group-hover:w-full"
                                style={{ backgroundColor: item.color }}
                            ></div>
                        </a>
                    ))}
                </div>

                {/* Recently Used Section */}
                <div className="mt-4 flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-500">Recently Used:</span>
                    <div className="flex space-x-2">
                        {QUICK_ACCESS_LINKS.slice(0, 3).map((item) => (
                            <button
                                key={item.name}
                                className="flex items-center px-2 py-1 rounded-full text-xs
                                    transition-colors hover:bg-gray-100"
                                style={{ color: item.color }}
                            >
                                <item.icon className="h-3 w-3 mr-1" />
                                <span>{item.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Performance Metrics Cards with Enhanced Design */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-[#b39b5a]/10 p-2 rounded-lg mr-2">
                        <BarChart3 className="h-5 w-5 text-[#b39b5a]" />
                    </span>
                    Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        Array.from({length: 4}).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                                </div>
                                <div className="h-8 w-2/3 bg-gray-200 rounded mb-3"></div>
                                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                            </div>
                        ))
                    ) : (
                        <>
                            <StatCard 
                                title="Total Revenue" 
                                value={`₹${orders.reduce((sum, order) => sum + (order.totalAmount || order.amount || order.total || 0), 0).toLocaleString()}`} 
                                change={stats.revenueChange || 0} 
                                icon={DollarSign} 
                                color="#22c55e"  // Success green
                            />
                            <StatCard 
                                title="All Orders" 
                                value={orders.length} 
                                change={stats.ordersChange || 0} 
                                icon={ShoppingCart} 
                                color="#3b82f6"  // Information blue
                            />
                            <StatCard 
                                title="Pending Orders" 
                                value={orders.filter(order => 
                                    ['pending', 'preparing', 'in-progress', 'new', 'received', 'confirmed'].includes(order.status)
                                ).length} 
                                change={stats.pendingChange || 0} 
                                icon={ListChecks} 
                                color="#f59e0b"  // Warning yellow
                                isNegativeBetter={true} 
                            />
                            <StatCard 
                                title="Available Tables" 
                                value={`${stats.availableTables}/${stats.totalTables}`} 
                                change={stats.tablesChange || 0} 
                                icon={Table} 
                                color="#b39b5a"  // Theme color
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Restaurant Orders Section */}
            <div className="mb-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="bg-orange-50 p-2 rounded-lg mr-2">
                                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                                </span>
                                Restaurant Orders
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                                    {loading ? '...' : orders.length} Orders Today
                                </span>
                                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    View All Orders
                                </button>
                            </div>
                        </h3>

                        {/* Order Stats */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {[
                                {
                                    label: 'In-House Orders',
                                    value: orders.filter(o => o.orderType === 'In-House').length,
                                    color: 'indigo'
                                },
                                {
                                    label: 'Regular Orders',
                                    value: orders.filter(o => o.orderType !== 'In-House').length,
                                    color: 'orange'
                                },
                                {
                                    label: 'Preparing',
                                    value: orders.filter(o => ['new', 'preparing'].includes(o.status)).length,
                                    color: 'yellow'
                                },
                                {
                                    label: 'Completed',
                                    value: orders.filter(o => ['ready', 'completed'].includes(o.status)).length,
                                    color: 'green'
                                }
                            ].map((stat) => (
                                <div key={stat.label} className={`bg-${stat.color}-50 rounded-lg p-4 border border-${stat.color}-100`}>
                                    <h4 className={`text-${stat.color}-700 text-sm font-medium`}>{stat.label}</h4>
                                    <p className="text-2xl font-bold mt-1">{loading ? '...' : stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Orders Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Table
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-4 text-center">
                                                <div className="animate-pulse flex justify-center">
                                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : orders.length > 0 ? (
                                        orders.slice(0, 5).map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{order._id.slice(-6)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    Table {order.tableNumber || 'N/A'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full
                                                        ${order.orderType === 'In-House' 
                                                            ? 'bg-indigo-100 text-indigo-800' 
                                                            : 'bg-orange-100 text-orange-800'}`}>
                                                        {order.orderType || 'Regular'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    {order.items?.length || 0} items
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₹{order.amount?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                                        ${order.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                                          order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                          'bg-purple-100 text-purple-800'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleTimeString()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex space-x-2">
                                                        <button 
                                                            onClick={() => handleViewOrder(order)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateOrder(order)}
                                                            className="text-green-600 hover:text-green-800 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                                        >
                                                            Update
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                                                No orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* View More Link */}
                        {orders.length > 5 && (
                            <div className="mt-4 text-center">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    View {orders.length - 5} more orders →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sales and Kitchen Operations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Sales Trend & KOT Summary */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                            <span className="bg-blue-50 p-2 rounded-lg mr-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                            </span>
                            Sales Performance & Kitchen Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Enhanced Sales Chart */}
                            <div className="md:col-span-2">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold text-gray-700">Weekly Revenue</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                +12.5% vs last week
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-64 relative">
                                        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                                                </linearGradient>
                                            </defs>
                                            <g className="grid">
                                                {[20, 40, 60, 80].map(y => (
                                                    <line 
                                                        key={y} 
                                                        x1="0" 
                                                        y1={y} 
                                                        x2="300" 
                                                        y2={y} 
                                                        stroke="#e5e7eb" 
                                                        strokeDasharray="4" 
                                                    />
                                                ))}
                                            </g>
                                            <polyline
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="3"
                                                points="0,90 42,70 85,60 128,80 171,45 214,30 257,50 300,20"
                                                className="filter drop-shadow"
                                            />
                                            <polyline
                                                fill="url(#salesGradient)"
                                                points="0,100 0,90 42,70 85,60 128,80 171,45 214,30 257,50 300,20 300,100"
                                            />
                                            {/* Interactive Points */}
                                            {[
                                                {x: 0, y: 90}, {x: 42, y: 70}, {x: 85, y: 60},
                                                {x: 128, y: 80}, {x: 171, y: 45}, {x: 214, y: 30},
                                                {x: 257, y: 50}, {x: 300, y: 20}
                                            ].map((point, i) => (
                                                <g key={i}>
                                                    <circle
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r="4"
                                                        fill="#3b82f6"
                                                        className="cursor-pointer transition-all duration-300"
                                                        onMouseOver="evt.target.setAttribute('r', '6')"
                                                        onMouseOut="evt.target.setAttribute('r', '4')"
                                                    />
                                                </g>
                                            ))}
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            {/* Kitchen Status */}
                            <div className="md:col-span-1">
                                <KitchenStatusWidget kotData={kotData} loading={loading} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Management Section */}
                <div className="lg:col-span-1">
                    <TableAvailabilityWidget tables={tables} loading={loading} />
                </div>
            </div>
            
            {/* Wastage Analysis & Reservations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Enhanced Wastage Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span className="bg-red-50 p-2 rounded-lg mr-2">
                                <Trash2 className="h-5 w-5 text-red-600" />
                            </span>
                            Wastage Analysis
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-gray-700">7-Day Trend</h4>
                                <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                        -2.3% vs last week
                                    </span>
                                </div>
                            </div>
                            <div className="h-[200px] relative">
                                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="wastageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>
                                    {/* Target Line */}
                                    <line 
                                        x1="0" y1="50" x2="300" y2="50" 
                                        stroke="#fca5a5" 
                                        strokeDasharray="4" 
                                        strokeWidth="1.5" 
                                    />
                                    <text x="250" y="45" fontSize="8" fill="#ef4444">Target (5%)</text>
                                    
                                    {/* Grid Lines */}
                                    {[20, 40, 60, 80].map(y => (
                                        <line 
                                            key={y} 
                                            x1="0" y1={y} x2="300" y2={y} 
                                            stroke="#e5e7eb" 
                                            strokeDasharray="4" 
                                        />
                                    ))}
                                    
                                    {/* Main Trend Line */}
                                    <polyline
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="3"
                                        points="0,80 50,60 100,70 150,45 200,55 250,40 300,35"
                                        className="filter drop-shadow"
                                    />
                                    <polyline
                                        fill="url(#wastageGradient)"
                                        points="0,100 0,80 50,60 100,70 150,45 200,55 250,40 300,35 300,100"
                                    />
                                    
                                    {/* Interactive Points */}
                                    {[
                                        {x: 0, y: 80}, {x: 50, y: 60}, {x: 100, y: 70},
                                        {x: 150, y: 45}, {x: 200, y: 55}, {x: 250, y: 40},
                                        {x: 300, y: 35}
                                    ].map((point, i) => (
                                        <g key={i} className="transition-transform">
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r="4"
                                                fill="#ef4444"
                                                className="cursor-pointer transition-all duration-300"
                                            />
                                        </g>
                                    ))}
                                </svg>
                                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <span key={day} className="text-center">{day}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wastage Status Widget */}
                <div className="lg:col-span-1">
                    <WastageStatusWidget wastageData={wastageData} loading={loading} />
                </div>

                {/* Enhanced Reservations Panel */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="bg-blue-50 p-2 rounded-lg mr-2">
                                    <CalendarCheck className="h-5 w-5 text-blue-600" />
                                </span>
                                Table Reservations
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    {loading ? '...' : reservations.length} Today
                                </span>
                            </div>
                        </h3>

                        {/* Today's Statistics */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <span className="text-sm text-gray-600 block">Current</span>
                                <span className="text-xl font-bold text-blue-600">
                                    {loading ? '...' : reservations.filter(r => {
                                        const now = new Date();
                                        const reservationDate = new Date(r.reservationDate || r.date);
                                        const reservationTime = new Date(reservationDate.toDateString() + ' ' + (r.reservationTimeIn || r.time));
                                        const endTime = new Date(reservationDate.toDateString() + ' ' + (r.reservationTimeOut || r.time));
                                        return now >= reservationTime && now <= endTime && reservationDate.toDateString() === now.toDateString();
                                    }).length}
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <span className="text-sm text-gray-600 block">Upcoming</span>
                                <span className="text-xl font-bold text-green-600">
                                    {loading ? '...' : reservations.filter(r => {
                                        const now = new Date();
                                        const reservationDate = new Date(r.reservationDate || r.date);
                                        const reservationTime = new Date(reservationDate.toDateString() + ' ' + (r.reservationTimeIn || r.time));
                                        return reservationTime > now && reservationDate.toDateString() === now.toDateString();
                                    }).length}
                                </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <span className="text-sm text-gray-600 block">Table N/A</span>
                                <span className="text-xl font-bold text-yellow-600">
                                    {loading ? '...' : reservations.filter(r => !r.tableNo && r.status !== 'confirm').length}
                                </span>
                            </div>
                        </div>

                        {/* Guest Summary */}
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 flex justify-between items-center">
                            <div className="flex items-center">
                                <span className="text-sm text-gray-600">{loading ? '...' : reservations.reduce((sum, r) => sum + (r.partySize || 0), 0)} Guests</span>
                                <span className="mx-2">|</span>
                                <span className="text-sm text-gray-600">Guest</span>
                            </div>
                            <span className="text-xs text-gray-500 italic">"{loading ? '...' : 'Average party size: ' + (reservations.length ? (reservations.reduce((sum, r) => sum + (r.partySize || 0), 0) / reservations.length).toFixed(1) : 0)}"</span>
                        </div>

                        {/* Detailed Reservation List */}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="animate-pulse space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                                    ))}
                                </div>
                            ) : reservations.length > 0 ? (
                                reservations
                                    .sort((a, b) => {
                                        const dateA = new Date(a.reservationDate || a.date);
                                        const timeA = new Date(dateA.toDateString() + ' ' + (a.reservationTime || a.time));
                                        const dateB = new Date(b.reservationDate || b.date);
                                        const timeB = new Date(dateB.toDateString() + ' ' + (b.reservationTime || b.time));
                                        return timeA - timeB;
                                    })
                                    .map((reservation) => {
                                        const reservationDate = new Date(reservation.reservationDate || reservation.date);
                                        const reservationTime = new Date(reservationDate.toDateString() + ' ' + (reservation.reservationTime || reservation.time));
                                        const now = new Date();
                                        const status = reservationTime > now ? 'upcoming' : 'current';
                                        const isPast = reservationTime < now;
                                        
                                        return (
                                            <div 
                                                key={reservation._id} 
                                                className={`p-4 rounded-xl border transition-all hover:shadow-md
                                                    ${status === 'upcoming' 
                                                        ? 'bg-green-50 border-green-100 hover:border-green-200' 
                                                        : 'bg-blue-50 border-blue-100 hover:border-blue-200'}
                                                    ${isPast ? 'opacity-60' : ''}
                                                `}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {reservation.guestName}
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            {reservation.partySize} Guests | {reservation.phoneNumber}
                                                        </span>
                                                        {reservation.specialRequests && (
                                                            <span className="text-xs text-gray-500 mt-1 italic">
                                                                "{reservation.specialRequests}"
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-sm font-bold
                                                            ${status === 'upcoming' ? 'text-green-700' : 'text-blue-700'}
                                                        `}>
                                                            {reservation.reservationTimeIn} - {reservation.reservationTimeOut}
                                                        </span>
                                                        <span className={`text-xs block mt-1 px-2 py-0.5 rounded
                                                            ${status === 'upcoming' 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-blue-100 text-blue-700'}
                                                        `}>
                                                            {status === 'upcoming' ? 'Upcoming' : 'Current'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="p-4 text-gray-500 text-center bg-gray-50 rounded-xl border border-gray-100">
                                    No reservations today
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex space-x-2">
                            <a 
                                href="/reservation"
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold 
                                    hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                <CalendarCheck className="h-4 w-4 mr-2" />
                                New Booking
                            </a>
                            <a 
                                href="/reservations"
                                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold 
                                    hover:bg-gray-200 transition-colors flex items-center justify-center"
                            >
                                View All
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Order Modal */}
            {showViewModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Order Details</h3>
                                <button 
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Order ID</label>
                                        <p className="text-gray-800">#{selectedOrder._id.slice(-6)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Table Number</label>
                                        <p className="text-gray-800">Table {selectedOrder.tableNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Order Type</label>
                                        <p className="text-gray-800">{selectedOrder.orderType || 'Regular'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Status</label>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                            ${selectedOrder.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                              selectedOrder.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                              selectedOrder.status === 'ready' ? 'bg-green-100 text-green-800' :
                                              'bg-purple-100 text-purple-800'}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Amount</label>
                                        <p className="text-gray-800">₹{selectedOrder.amount?.toFixed(2) || '0.00'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Created At</label>
                                        <p className="text-gray-800">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">Order Items</label>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            {selectedOrder.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Order Modal */}
            {showUpdateModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Update Order Status</h3>
                                <button 
                                    onClick={() => setShowUpdateModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Order ID</label>
                                    <p className="text-gray-800">#{selectedOrder._id.slice(-6)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Current Status</label>
                                    <p className="text-gray-800 capitalize">{selectedOrder.status}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Update Status</label>
                                    <div className="space-y-2">
                                        {['new', 'preparing', 'ready', 'completed'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateOrderStatus(selectedOrder._id, status)}
                                                className={`w-full text-left px-4 py-2 rounded-lg border transition-colors
                                                    ${selectedOrder.status === status 
                                                        ? 'bg-blue-50 border-blue-200 text-blue-800' 
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                                disabled={selectedOrder.status === status}
                                            >
                                                <span className="capitalize font-medium">{status}</span>
                                                {selectedOrder.status === status && (
                                                    <span className="text-xs text-blue-600 ml-2">(Current)</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default DashboardContent;

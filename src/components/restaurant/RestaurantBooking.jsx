import { useState } from 'react';
import BookTable from './ResturantOrders';
import AvailableTable from './Availabletable';
import AllBookings from './Allorders';

const Booking = () => {
  const [activeTab, setActiveTab] = useState('available');

  const tabs = [
    // { id: 'book', label: 'Book Table', component: BookTable },
    { id: 'available', label: 'Available Tables', component: AvailableTable },
    { id: 'all', label: 'All Bookings', component: AllBookings }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text hover:text-hover hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {ActiveComponent && <ActiveComponent />}
    </div>
  );
};

export default Booking;

import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import Table from "./Table";
import Menu from "./Menu";
import Order from "./Order";
import DashboardLoader from '../DashboardLoader';

const Restaurant = () => {
  const [activeTab, setActiveTab] = useState("menu");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardLoader pageName="Restaurant Management" />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Restaurant Management</h1>
      
      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6">
        {['menu', 'orders', 'tables'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'menu' && <Menu />}
      {activeTab === 'orders' && <Order />}
      {activeTab === 'tables' && <Table />}
    </div>
  );
};







export default Restaurant;

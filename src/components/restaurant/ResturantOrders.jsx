import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { FaUtensils } from 'react-icons/fa';
import Order from './Order';

const RestaurantOrders = () => {
  const { axios } = useAppContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f5ef] to-[#c3ad6b]/30">
      <div className="w-full">
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-[#c3ad6b]/30 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl shadow-lg bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a]">
              <FaUtensils className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#c3ad6b]">
                Create Order
              </h1>
              <p className="text-gray-600 mt-1">Manage restaurant orders and menu items</p>
            </div>
          </div>
        </div>
        
        <div className="w-full">
          <Order />
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrders;

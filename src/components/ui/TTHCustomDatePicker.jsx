import React, { useState, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const CustomDatePicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const pickerRef = useRef(null);

  const today = new Date();
  const selectedDate = value ? new Date(value) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDateDisabled = (date) => {
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (!isDateDisabled(newDate)) {
      // Format the date in local timezone to avoid timezone issues
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const localDateString = `${year}-${month}-${dayStr}`;
      
      onChange({ target: { value: localDateString } });
      setIsOpen(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (newDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentDate(newDate);
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isDisabled = isDateDisabled(date);
    const isSelected = selectedDate && 
      selectedDate.getDate() === day && 
      selectedDate.getMonth() === currentDate.getMonth() && 
      selectedDate.getFullYear() === currentDate.getFullYear();
    const isToday = today.getDate() === day && 
      today.getMonth() === currentDate.getMonth() && 
      today.getFullYear() === currentDate.getFullYear();

    days.push(
      <button
        key={day}
        onClick={() => handleDateSelect(day)}
        disabled={isDisabled}
        className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
          isSelected
            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
            : isToday
            ? 'bg-blue-100 text-[#194cbf] border-2 border-blue-300'
            : isDisabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-orange-100 hover:text-orange-600'
        }`}
      >
        {day}
      </button>
    );
  }

  const englishMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div ref={pickerRef} className="relative w-full flex flex-col justify-end min-w-[220px] group">
      <label className="block text-gray-700 font-bold mb-2 pr-1 text-base text-right group-hover:text-orange-600 transition-colors">
        {label}
      </label>
      
      {/* Date Input */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border-2 border-gray-200 text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-300 shadow-sm text-right min-w-[220px] group-hover:border-orange-300 group-hover:shadow-md cursor-pointer text-gray-700"
        >
          {selectedDate ? formatDate(selectedDate) : 'Select Date'}
        </button>
        <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-[9999]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaChevronRight className="text-gray-600" />
            </button>
            <h3 className="text-lg font-bold text-gray-900">
              {englishMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaChevronLeft className="text-gray-600" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Format today's date in local timezone
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const localDateString = `${year}-${month}-${day}`;
                
                onChange({ target: { value: localDateString } });
                setIsOpen(false);
              }}
              className="w-full bg-blue-100 text-[#194cbf] py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="mt-2 text-xs text-orange-600 font-medium">
          Selected: {formatDate(selectedDate)}
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker; 
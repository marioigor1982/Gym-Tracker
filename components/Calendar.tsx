import React, { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface CalendarProps {
  workoutDays: Set<string>;
  onDateClick: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ workoutDays, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const renderHeader = () => {
    const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
    return (
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <ArrowLeftIcon />
        </button>
        <h3 className="text-xl font-semibold capitalize">
          {monthFormat.format(currentDate)}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <ArrowRightIcon />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-400">
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    // Blank cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`blank-${i}`} className="p-2"></div>);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = new Date().toDateString() === date.toDateString();
      const hasWorkout = workoutDays.has(date.toDateString());

      cells.push(
        <div key={day} className="relative">
          <button
            onClick={() => onDateClick(date)}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full transition-colors mx-auto
              ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-200'}
              ${hasWorkout ? 'hover:bg-blue-500' : 'hover:bg-gray-700'}
            `}
          >
            {day}
          </button>
          {hasWorkout && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full"></div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-y-2 mt-4">
        {cells}
      </div>
    );
  };

  return (
    <div>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default Calendar;

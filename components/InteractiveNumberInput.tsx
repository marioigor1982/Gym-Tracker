import React, { useState, useRef, useEffect } from 'react';

interface InteractiveNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const InteractiveNumberInput: React.FC<InteractiveNumberInputProps> = ({
  value,
  onChange,
  step,
  min = 0,
  max,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  
  useEffect(() => {
    valueRef.current = value;
    if (!isEditing) {
      setInputValue(String(value));
    }
  }, [value, isEditing]);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleValueChange = (newValue: number) => {
    let clampedValue = newValue;
    if (min !== undefined) clampedValue = Math.max(min, clampedValue);
    if (max !== undefined) clampedValue = Math.min(max, clampedValue);
    onChange(clampedValue);
  };

  const handleMouseDown = (direction: 'increment' | 'decrement') => {
    if (disabled) return;
    const change = direction === 'increment' ? step : -step;
    handleValueChange(value + change);

    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        handleValueChange(valueRef.current + change);
      }, 100);
    }, 500);
  };
  
  const handleMouseUpOrLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleBlur = () => {
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue)) {
      handleValueChange(parsedValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setInputValue(String(value)); // Revert changes
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-24 bg-gray-900 border border-blue-500 rounded-md p-2 text-center text-lg font-mono focus:outline-none"
        step={step}
      />
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onMouseDown={() => handleMouseDown('decrement')}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={() => handleMouseDown('decrement')}
        onTouchEnd={handleMouseUpOrLeave}
        className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        aria-label="Diminuir"
      >
        -
      </button>
      <button
        type="button"
        onClick={() => !disabled && setIsEditing(true)}
        className="px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700/50 transition-colors disabled:cursor-not-allowed w-24 text-center"
        disabled={disabled}
      >
        <span className={`font-mono text-xl tabular-nums ${disabled ? 'text-gray-400' : 'text-white'}`}>{value}</span>
      </button>
      <button
        type="button"
        onMouseDown={() => handleMouseDown('increment')}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={() => handleMouseDown('increment')}
        onTouchEnd={handleMouseUpOrLeave}
        className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
};

export default InteractiveNumberInput;

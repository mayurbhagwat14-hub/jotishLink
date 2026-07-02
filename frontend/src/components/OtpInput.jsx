import React, { useRef, useEffect } from 'react';

const OtpInput = ({ 
  length = 4, 
  value = [], 
  onChange, 
  inputClassName = "w-14 h-14 bg-white border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 shadow-sm transition-all duration-200",
  containerClassName = "flex gap-3 justify-center mb-8",
  autoFocus = false
}) => {
  const inputRefs = useRef([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 100);
    }
  }, [autoFocus]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (value[index] === '' && index > 0) {
        // Current input is empty, move to previous and clear it
        const newOtp = [...value];
        newOtp[index - 1] = '';
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Let the default behavior clear the current input
        // (the onChange handler will fire for the deletion)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return; // Only allow numbers

    let newValue = val;
    if (newValue.length > 1) {
      newValue = newValue.slice(-1);
    }

    const newOtp = [...value];
    newOtp[index] = newValue;
    onChange(newOtp);

    // Auto-advance if value is typed
    if (newValue !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      const newOtp = [...value];
      for (let i = 0; i < length; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      onChange(newOtp);
      // Focus next empty input, or the last input
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <div className={containerClassName}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          className={inputClassName}
        />
      ))}
    </div>
  );
};

export default OtpInput;

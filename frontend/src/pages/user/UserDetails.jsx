import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiUser, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { updateUser, registerUserThunk } from '../../store/slices/authSlice';

const ScrollWheel = ({ options, value, onChange, className }) => {
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const isFirstRender = useRef(true);
  
  // Keep track of the value locally to render immediate feedback
  const [prevValue, setPrevValue] = useState(value);
  const [localValue, setLocalValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalValue(value);
  }

  // Sync scroll position when value or options change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targetIndex = options.indexOf(value);
    if (targetIndex === -1) return;

    const targetScrollTop = targetIndex * 40;
    
    // Only scroll if the container is not already close to the target
    if (Math.abs(container.scrollTop - targetScrollTop) > 2) {
      isProgrammaticScroll.current = true;
      container.scrollTo({
        top: targetScrollTop,
        behavior: isFirstRender.current ? 'auto' : 'smooth'
      });
      
      // Clear flag after smooth scroll is expected to end
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, isFirstRender.current ? 50 : 250);
    }
    isFirstRender.current = false;
  }, [value, options]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const onScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Ignore scroll events during programmatic scrolling
    if (isProgrammaticScroll.current) return;

    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / 40);

    if (index >= 0 && index < options.length) {
      const selectedValue = options[index];
      
      // Update local state instantly for visual highlight feedback
      if (selectedValue !== localValue) {
        setLocalValue(selectedValue);
      }

      // Debounce the call to parent onChange until scroll finishes
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (selectedValue !== value) {
          onChange(selectedValue);
        }
      }, 100);
    }
  };

  const handleItemClick = (index) => {
    const container = containerRef.current;
    if (!container) return;
    
    isProgrammaticScroll.current = true;
    container.scrollTo({
      top: index * 40,
      behavior: 'smooth'
    });
    
    const selectedValue = options[index];
    setLocalValue(selectedValue);
    onChange(selectedValue);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 250);
  };

  return (
    <div className={`relative h-[120px] overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Top spacer */}
        <div className="h-10 shrink-0 pointer-events-none" />
        
        {/* Options */}
        {options.map((opt, idx) => {
          const isSelected = opt === localValue;
          return (
            <div
              key={opt}
              onClick={() => handleItemClick(idx)}
              className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'text-gray-800 text-[18px] font-bold scale-110'
                  : 'text-gray-300 text-[14px] font-semibold hover:text-gray-400'
              }`}
            >
              {opt}
            </div>
          );
        })}

        {/* Bottom spacer */}
        <div className="h-10 shrink-0 pointer-events-none" />
      </div>
    </div>
  );
};

const steps = [
  { id: 1, title: 'Enter Your Details', question: 'Hey there!\nWhat is your Name?', type: 'name' },
  { id: 2, title: 'Enter Your Details', question: 'What is your gender?', type: 'gender' },
  { id: 3, title: 'Enter Your Details', question: 'Enter your birth date', type: 'dob' },
  { id: 4, title: 'Enter Your Details', question: 'Do you know your time of birth?', type: 'time_choice' },
  { id: 5, title: 'Enter Your Details', question: 'Enter your birth time', type: 'time' },
  { id: 6, title: 'Enter Your Details', question: 'Where were you born?', type: 'birthplace' },
];

const popularCities = [
  'Mumbai, Maharashtra',
  'Delhi, NCR',
  'Bengaluru, Karnataka',
  'Hyderabad, Telangana',
  'Ahmedabad, Gujarat',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Pune, Maharashtra',
  'Jaipur, Rajasthan',
  'Indore, Madhya Pradesh',
  'Bhopal, Madhya Pradesh'
];

const UserDetails = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [knowsTime, setKnowsTime] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    dobDay: '15',
    dobMonth: '07',
    dobYear: '2000',
    birthHour: '11',
    birthMin: '43',
    birthPeriod: 'AM',
    birthplace: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState('');
  const [stepError, setStepError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirectTo = location.state?.redirectTo || '/user/home';
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // If user is already registered, bypass details form entirely
    if (user && user.name && user.name !== 'Guest User') {
      navigate('/user/home', { replace: true });
    }
  }, [user, navigate]);

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('userDetailsApplyData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
        if (parsed.knowsTime !== undefined) setKnowsTime(parsed.knowsTime);
        if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
      } catch (err) {
        console.error('Failed to parse local storage data', err);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    const dataToSave = {
      formData,
      currentStep,
      knowsTime,
      searchQuery
    };
    localStorage.setItem('userDetailsApplyData', JSON.stringify(dataToSave));
  }, [formData, currentStep, knowsTime, searchQuery]);

  const step = steps[currentStep];



  const validateStep = (stepType) => {
    switch (stepType) {
      case 'name':
        if (!formData.name || formData.name.trim() === '') {
          return 'Name is required';
        }
        if (formData.name.trim().length < 3) {
          return 'Name must be at least 3 characters long';
        }
        if (!/^[a-zA-Z\s.-]+$/.test(formData.name)) {
          return 'Name can only contain letters, spaces, dots, and hyphens';
        }
        return '';
      case 'birthplace':
        if (!formData.birthplace || formData.birthplace.trim() === '') {
          return 'Place of birth is required';
        }
        if (!/^[a-zA-Z\s,.-]+$/.test(formData.birthplace)) {
          return 'Place of birth can only contain letters, spaces, commas, dots, and hyphens';
        }
        if (formData.birthplace.length > 100) {
          return 'Place of birth cannot exceed 100 characters';
        }
        return '';
      case 'dob':
        if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
          return 'Date of birth is required';
        }
        return '';
      default:
        return '';
    }
  };

  const handleNext = async () => {
    setApiError('');
    setStepError('');

    // Check step validation before proceeding
    const validationError = validateStep(step.type);
    if (validationError) {
      setStepError(validationError);
      return;
    }

    if (step.type === 'time_choice' && !knowsTime) {
      // Skip the time entry step and go straight to birthplace (Step index 5)
      setCurrentStep(5);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      let finalTime = '';
      if (knowsTime && formData.birthHour) {
        let h = parseInt(formData.birthHour, 10);
        const m = formData.birthMin.padStart(2, '0');
        if (formData.birthPeriod === 'PM' && h < 12) {
          h += 12;
        } else if (formData.birthPeriod === 'AM' && h === 12) {
          h = 0;
        }
        finalTime = `${String(h).padStart(2, '0')}:${m}`;
      }

      const payload = {
        name: formData.name,
        gender: formData.gender,
        dob: `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`,
        timeOfBirth: finalTime || '', // Send empty string if not knowsTime
        placeOfBirth: formData.birthplace,
      };

      try {
        await dispatch(registerUserThunk(payload)).unwrap();
        dispatch(updateUser(payload));
        localStorage.removeItem('userDetailsApplyData'); // Clear after successful completion
        navigate(redirectTo);
      } catch (err) {
        console.error("API registration failed", err);
        setApiError(err.message || err.error || (typeof err === 'string' ? err : 'Registration failed. Please try again.'));
      }
    }
  };

  const handleBack = () => {
    setApiError('');
    setStepError('');
    if (currentStep === 5 && !knowsTime) {
      // Go back past the skipped time selection to time_choice (Step index 3)
      setCurrentStep(3);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const canProceed = () => {
    switch (step.type) {
      case 'name':
        return formData.name.trim().length > 0;
      case 'gender':
        return formData.gender !== '';
      case 'dob':
        return !!(formData.dobDay && formData.dobMonth && formData.dobYear);
      case 'time_choice':
        return true;
      case 'time':
        return true;
      case 'birthplace':
        return formData.birthplace.trim().length > 0;
      default:
        return false;
    }
  };

  // Autocomplete debouncing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    const localMatches = popularCities.filter(c =>
      c.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5&accept-language=en`);
        const data = await res.json();
        
        const apiSuggestions = data.map(item => {
          const address = item.address;
          const placeName = address.city || address.town || address.village || address.suburb || item.name;
          const state = address.state || '';
          const country = address.country || '';
          
          let display = placeName;
          if (state) display += `, ${state}`;
          if (country && country !== 'India') display += `, ${country}`;
          return display;
        });

        const merged = Array.from(new Set([...localMatches, ...apiSuggestions]));
        setSuggestions(merged);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setSuggestions(localMatches);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Months List
  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthName = monthsList[parseInt(formData.dobMonth) - 1] || 'Jan';

  const handleMonthChange = (monthName) => {
    const monthIndex = monthsList.indexOf(monthName) + 1;
    const monthStr = String(monthIndex).padStart(2, '0');
    const daysInNewMonth = new Date(parseInt(formData.dobYear), monthIndex, 0).getDate();
    let dayVal = parseInt(formData.dobDay);
    if (dayVal > daysInNewMonth) {
      dayVal = daysInNewMonth;
    }
    setFormData({
      ...formData,
      dobMonth: monthStr,
      dobDay: String(dayVal).padStart(2, '0')
    });
  };

  // Days list based on month selection
  const daysInMonth = new Date(parseInt(formData.dobYear), parseInt(formData.dobMonth), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  const currentDay = formData.dobDay;

  const handleDayChange = (dayStr) => {
    setFormData({ ...formData, dobDay: dayStr });
  };

  // Years list
  const years = Array.from({ length: 87 }, (_, i) => String(2026 - i));
  const currentYear = formData.dobYear;

  const handleYearChange = (yearStr) => {
    const yearVal = parseInt(yearStr);
    const monthVal = parseInt(formData.dobMonth);
    const daysInNewMonth = new Date(yearVal, monthVal, 0).getDate();
    let dayVal = parseInt(formData.dobDay);
    if (dayVal > daysInNewMonth) {
      dayVal = daysInNewMonth;
    }
    setFormData({
      ...formData,
      dobYear: yearStr,
      dobDay: String(dayVal).padStart(2, '0')
    });
  };

  // Hour list (1-12)
  const hours = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const currentHour = formData.birthHour;
  const handleHourChange = (h) => setFormData({ ...formData, birthHour: h });

  // Minutes list (00-59)
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const currentMin = formData.birthMin;
  const handleMinChange = (m) => setFormData({ ...formData, birthMin: m });

  // Period list (AM/PM)
  const periods = ['AM', 'PM'];
  const currentPeriod = formData.birthPeriod;
  const handlePeriodChange = (p) => setFormData({ ...formData, birthPeriod: p });

  const renderStepIndicator = () => {
    const indicators = [
      { id: 1, activeOn: [0], completedOn: (c) => c > 0, icon: <FiUser size={13} /> },
      { id: 2, activeOn: [1], completedOn: (c) => c > 1, icon: <span className="text-[12px] font-extrabold leading-none">♂♀</span> },
      { id: 3, activeOn: [2], completedOn: (c) => c > 2, icon: <FiCalendar size={13} /> },
      { id: 4, activeOn: [3, 4], completedOn: (c) => c > 4, icon: <FiClock size={13} /> },
      { id: 5, activeOn: [5], completedOn: (c) => c > 5, icon: <FiMapPin size={13} /> },
    ];

    return (
      <div className="flex items-center justify-between w-full max-w-[240px] mx-auto mb-8 select-none">
        {indicators.map((ind) => {
          const isActive = ind.activeOn.includes(currentStep);
          const isCompleted = ind.completedOn(currentStep);
          const targetStep = ind.activeOn[0];
          const isClickable = targetStep < currentStep;

          return (
            <div
              key={ind.id}
              onClick={() => {
                if (isClickable) {
                  setApiError('');
                  setStepError('');
                  setCurrentStep(targetStep);
                }
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                isClickable ? 'cursor-pointer hover:opacity-80 hover:scale-110' : ''
              } ${
                isCompleted
                  ? 'bg-[#FF6A1A]'
                  : isActive
                  ? 'bg-[#FF6A1A] text-white ring-4 ring-orange-100 shadow-sm'
                  : 'bg-gray-200'
              }`}
            >
              {isActive ? (
                ind.icon
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-transparent' : 'bg-gray-400'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step.type) {
      case 'name':
        return (
    <div className="w-full px-2 max-w-sm mx-auto">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setStepError('');
                const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
                setFormData({ ...formData, name: val });
              }}
              placeholder="Enter Your Name"
              maxLength={50}
              className="w-full border-b-2 border-gray-200 focus:border-[#FF6A1A] py-3 text-[16px] text-gray-800 font-semibold outline-none bg-transparent transition-colors placeholder-gray-300"
              autoFocus
            />
            {stepError && (
              <p className="text-red-500 text-xs font-semibold mt-2.5 pl-1 animate-fade-in">
                {stepError}
              </p>
            )}
          </div>
        );

      case 'gender':
        return (
    <div className="flex gap-10 justify-center items-center py-6 select-none">
            {/* Male */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'Male' })}
                className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  formData.gender === 'Male'
                    ? 'bg-[#FF6A1A] border-[#FF6A1A] text-white shadow-lg shadow-orange-500/20 active:scale-95'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12">
                  <circle cx="12" cy="5" r="2.5" />
                  <path d="M12 7.5c-2 0-3.5 1.5-3.5 3.5v3.5h1.5V20h4v-5.5h1.5V11c0-2-1.5-3.5-3.5-3.5z" />
                  <path d="M10.5 20v3M13.5 20v3" />
                </svg>
              </button>
              <span className="text-gray-800 font-bold text-[14px]">Male</span>
            </div>

            {/* Female */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'Female' })}
                className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  formData.gender === 'Female'
                    ? 'bg-[#FF6A1A] border-[#FF6A1A] text-white shadow-lg shadow-orange-500/20 active:scale-95'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12">
                  <circle cx="12" cy="5" r="2.5" />
                  <path d="M12 7.5c-2 0-3.5 1.5-3.5 3.5v3l2 6h3l2-6V11c0-2-1.5-3.5-3.5-3.5z" />
                  <path d="M10.5 20v3M13.5 20v3" />
                </svg>
              </button>
              <span className="text-gray-800 font-bold text-[14px]">Female</span>
            </div>
          </div>
        );

      case 'dob':
        return (
    <div className="w-full">
            {/* Drum Date Picker */}
            <div className="flex justify-center items-center max-w-[280px] mx-auto py-6 bg-white border border-gray-100 rounded-2xl shadow-sm relative select-none">
              {/* Overlay Separators */}
              <div className="absolute left-6 right-6 top-[64px] h-[1px] bg-gray-200" />
              <div className="absolute left-6 right-6 top-[104px] h-[1px] bg-gray-200" />

              <div className="flex justify-around w-full items-center">
                {/* Month Column */}
                <ScrollWheel
                  options={monthsList}
                  value={currentMonthName}
                  onChange={handleMonthChange}
                  className="w-16"
                />

                {/* Day Column */}
                <ScrollWheel
                  options={days}
                  value={currentDay}
                  onChange={handleDayChange}
                  className="w-16"
                />

                {/* Year Column */}
                <ScrollWheel
                  options={years}
                  value={currentYear}
                  onChange={handleYearChange}
                  className="w-16"
                />
              </div>
            </div>
          </div>
        );

      case 'time_choice':
        return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto select-none">
            {/* Yes Card */}
            <button
              type="button"
              onClick={() => setKnowsTime(true)}
              className={`w-full flex items-center gap-4 border-2 rounded-2xl p-4 transition-all duration-300 ${
                knowsTime === true
                  ? 'border-[#FF6A1A] bg-orange-50/10 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-gray-800 font-bold text-[16px]">Yes</span>
            </button>

            {/* No Card */}
            <button
              type="button"
              onClick={() => setKnowsTime(false)}
              className={`w-full flex items-center gap-4 border-2 rounded-2xl p-4 transition-all duration-300 ${
                knowsTime === false
                  ? 'border-[#FF6A1A] bg-orange-50/10 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <span className="text-gray-800 font-bold text-[16px]">No</span>
            </button>

            <p className="text-gray-400 text-[12px] font-semibold mt-3 leading-relaxed text-center">
              Note: Without time of birth, we can still achieve upto 80% accurate predictions
            </p>
          </div>
        );

      case 'time':
        return (
    <div className="w-full flex flex-col items-center">
            {/* Drum Time Picker */}
            <div className="flex justify-center items-center max-w-[280px] w-full mx-auto py-6 bg-white border border-gray-100 rounded-2xl shadow-sm relative select-none">
              {/* Overlay Separators */}
              <div className="absolute left-6 right-6 top-[64px] h-[1px] bg-gray-200" />
              <div className="absolute left-6 right-6 top-[104px] h-[1px] bg-gray-200" />

              <div className="flex justify-around w-full items-center">
                {/* Hour Column */}
                <ScrollWheel
                  options={hours}
                  value={currentHour}
                  onChange={handleHourChange}
                  className="w-12"
                />

                <span className="text-gray-400 font-bold text-[20px] mb-1 select-none">:</span>

                {/* Minute Column */}
                <ScrollWheel
                  options={minutesList}
                  value={currentMin}
                  onChange={handleMinChange}
                  className="w-12"
                />

                {/* Period Column */}
                <ScrollWheel
                  options={periods}
                  value={currentPeriod}
                  onChange={handlePeriodChange}
                  className="w-12"
                />
              </div>
            </div>

            {/* Skip Option Checkbox */}
            <div className="flex items-center gap-2.5 mt-6 justify-center">
              <input
                type="checkbox"
                id="dontKnowTime"
                checked={!knowsTime}
                onChange={(e) => {
                  const val = e.target.checked;
                  setKnowsTime(!val);
                  if (val) {
                    setFormData({ ...formData, birthHour: '', birthMin: '' });
                  } else {
                    setFormData({ ...formData, birthHour: '11', birthMin: '43' });
                  }
                }}
                className="w-4 h-4 text-[#FF6A1A] border-gray-300 rounded focus:ring-[#FF6A1A] cursor-pointer"
              />
              <label htmlFor="dontKnowTime" className="text-gray-700 text-sm font-semibold select-none cursor-pointer">
                Don't know my exact time of birth
              </label>
            </div>
          </div>
        );

      case 'birthplace':
        return (
    <div className="flex flex-col gap-4 w-full px-2 max-w-sm mx-auto relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setStepError('');
                  setSearchQuery(val);
                  setFormData({ ...formData, birthplace: val });
                  if (val.trim().length < 2) {
                    setSuggestions([]);
                  }
                }}
                placeholder="Where were you born?"
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 pr-10 text-[15px] font-semibold text-gray-800 outline-none focus:border-[#FF6A1A] shadow-sm transition-all"
                autoFocus
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              {isSearching && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#fa6830] border-t-transparent" />
                </div>
              )}
            </div>
            {stepError && (
              <p className="text-red-500 text-xs font-semibold mt-0.5 pl-1 animate-fade-in">
                {stepError}
              </p>
            )}

            {/* Suggestions Overlay */}
            {suggestions.length > 0 && (
              <div className="absolute left-2 right-2 top-14 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-50">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setStepError('');
                      setFormData({ ...formData, birthplace: sug });
                      setSearchQuery(sug);
                      setSuggestions([]);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50/50 text-[14px] text-gray-700 font-semibold transition-colors flex items-center gap-2"
                  >
                    <FiMapPin size={14} className="text-[#FF6A1A]" />
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Popular Cities */}
            <div className="mt-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 pl-1">
                Popular Cities
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularCities.map((city) => {
                  const isSelected = formData.birthplace === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setStepError('');
                        setFormData({ ...formData, birthplace: city });
                        setSearchQuery(city);
                        setSuggestions([]);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[#FF6A1A] border-[#FF6A1A] text-white shadow-md shadow-orange-100'
                          : 'bg-orange-50/20 border-orange-100 text-orange-700 hover:bg-orange-100/50'
                      }`}
                    >
                      {city.split(',')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-[100dvh] bg-[#FCFAF7] flex flex-col font-sans relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col px-4 pt-4 pb-4 bg-[#FCFAF7]">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={handleBack} className="text-gray-800 p-1 -ml-1 hover:bg-orange-50/50 rounded-full transition-colors">
            <FiArrowLeft size={22} />
          </button>
          <h1 className="text-[16px] font-bold text-gray-800">{step.title}</h1>
        </div>

        {/* Step indicator progress bar */}
        {renderStepIndicator()}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col px-6 pt-6 relative overflow-y-auto no-scrollbar">
        <h2 className="text-[20px] font-bold text-gray-700 leading-snug mb-10 text-center whitespace-pre-line">
          {step.question}
        </h2>
        {renderStepContent()}
      </div>

      {/* Action CTA Button */}
      <div className="px-6 pb-12 mt-auto">
        {apiError && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold text-center animate-fade-in">
            {apiError}
          </div>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full py-4 rounded-full font-bold text-[15px] tracking-wide transition-all duration-300 ${
            canProceed()
              ? 'bg-[#FF6A1A] text-white shadow-lg shadow-orange-500/20 hover:bg-[#E55B14] active:scale-[0.98]'
              : 'bg-orange-200 text-white cursor-not-allowed'
          }`}
        >
          {currentStep === steps.length - 1 ? 'START CHAT WITH ASTROLOGER' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default UserDetails;

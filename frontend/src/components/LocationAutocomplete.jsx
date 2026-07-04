import { useState, useEffect, useRef } from 'react';
import { FiMapPin } from 'react-icons/fi';

const popularCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal'];

const LocationAutocomplete = ({ value, onChange, onSelectDetailed, placeholder = "Enter location", className = "", required = false, name = "location" }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Click outside to close
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = value?.trim() || '';
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Only search if user hasn't just selected something exact from the list
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&accept-language=en`);
        const data = await res.json();
        
        const apiSuggestions = data.map(item => {
          const address = item.address;
          const placeName = address.city || address.town || address.village || address.suburb || item.name;
          const state = address.state || '';
          const country = address.country || '';
          
          let display = placeName;
          if (state) display += `, ${state}`;
          if (country && country !== 'India') display += `, ${country}`; 
          
          return { label: display, placeName, state, country };
        });

        // Filter out duplicates based on label
        const uniqueApi = [];
        const seen = new Set();
        for (const s of apiSuggestions) {
          if (!seen.has(s.label)) {
            seen.add(s.label);
            uniqueApi.push(s);
          }
        }
        
        // Find local matches to augment API results
        const localMatches = popularCities
          .filter(c => c.toLowerCase().includes(query.toLowerCase()))
          .map(c => ({ label: c, placeName: c, state: '', country: 'India' }));
        
        // Combine, prioritize local exact matches, but rely mostly on API
        const combined = [...localMatches, ...uniqueApi].filter((v, i, a) => a.findIndex(t => (t.label === v.label)) === i).slice(0, 5);
        setSuggestions(combined);
        setShowDropdown(true);
      } catch (err) {
        console.error('Location search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [value]);

  const handleSelect = (placeObj) => {
    onChange({ target: { name, value: placeObj.placeName || placeObj.label } });
    if (onSelectDetailed) {
      onSelectDetailed(placeObj);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input 
        type="text" 
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        placeholder={placeholder} 
        className={className || "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#fa6830] transition-all font-medium text-gray-800"}
        autoComplete="off"
      />
      
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, idx) => (
            <div 
              key={idx}
              onClick={() => handleSelect(place)}
              className="px-4 py-3 hover:bg-orange-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <FiMapPin className="text-[#fa6830]" size={14} />
              </div>
              <span className="text-[14px] text-gray-700 font-medium">{place.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;

import { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';

const SearchableDropdown = ({ options, value, onChange, placeholder, name, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
    setSearchTerm(''); // Reset search term after selection
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full px-4 py-3 rounded-xl bg-gray-50 border flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-[#fa6830] ring-2 ring-orange-500/20' : 'border-gray-200'}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 50);
          }
        }}
      >
        <span className={`font-medium ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Hidden input for HTML validation if required */}
      {required && (
        <input 
          type="text"
          name={name}
          value={value}
          onChange={() => {}}
          required={required}
          className="absolute opacity-0 w-0 h-0 pointer-events-none" 
          tabIndex={-1}
          id={`input-${name}`}
        />
      )}
      
      {/* We use id here so the validation scroll logic can find the wrapper and scroll to it */}
      {!required && (
        <div id={`input-${name}`} className="absolute top-0 left-0 w-0 h-0 pointer-events-none"></div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg flex flex-col max-h-60 overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <FiSearch className="text-gray-400 ml-2" />
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-sm p-2 font-medium text-gray-800"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto overflow-x-hidden">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-3 hover:bg-orange-50 cursor-pointer text-[14px] font-medium transition-colors border-b border-gray-50 last:border-0 ${value === opt ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}`}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;

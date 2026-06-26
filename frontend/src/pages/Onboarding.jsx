import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const { appName, appLogo } = useSelector(state => state.settings) || { appName: 'JyotishLink', appLogo: '' };

  const slides = [
    {
      id: 1,
      type: 'logo',
      title: appName,
      subtitle: 'Your Personal Astrology Guide',
    },
    {
      id: 2,
      stat: '100%',
      label: 'Privacy',
      desc: 'Your conversations are fully private & confidential',
    },
    {
      id: 3,
      stat: '10000+',
      label: 'Top Astrologers of India',
      desc: 'Verified & experienced astrologers at your fingertips',
    },
    {
      id: 4,
      stat: '3Cr+',
      label: 'Happy Customers',
      desc: 'Trusted by millions across India',
    },
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= slides.length - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleSkip = () => {
    navigate('/user/login');
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/user/login');
    }
  };

  const slide = slides[currentSlide];

  return (
    <div
      className={`min-h-screen bg-astro-yellow flex flex-col items-center justify-center relative overflow-hidden transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Decorative floating stars */}
      <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-yellow-600/30 rounded-full animate-float" />
      <div className="absolute top-[25%] right-[15%] w-3 h-3 bg-yellow-600/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-[30%] left-[20%] w-1.5 h-1.5 bg-yellow-600/25 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[45%] right-[25%] w-2 h-2 bg-yellow-600/15 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-[20%] right-[10%] w-3 h-3 bg-yellow-600/20 rounded-full animate-float" style={{ animationDelay: '0.7s' }} />

      {/* Curved line decorations */}
      <svg className="absolute top-[20%] right-0 w-40 h-40 opacity-20" viewBox="0 0 200 200">
        <path d="M 0 100 Q 100 0 200 100" fill="none" stroke="#b8860b" strokeWidth="2" />
      </svg>
      <svg className="absolute bottom-[15%] left-0 w-48 h-48 opacity-15" viewBox="0 0 200 200">
        <path d="M 0 100 Q 100 200 200 100" fill="none" stroke="#b8860b" strokeWidth="2" />
      </svg>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-gray-700 font-medium text-[15px] z-20 hover:text-gray-900 transition-colors"
      >
        Skip
      </button>

      {/* Content area */}
      <div className="flex flex-col items-center justify-center flex-1 px-8 text-center animate-fade-in" key={slide.id}>
        {slide.type === 'logo' ? (
          <>
            {appLogo ? (
              <div className="flex flex-col items-center mb-4 mt-4 mix-blend-multiply relative z-10">
                <img src={appLogo} alt={appName} className="h-[180px] w-auto object-contain drop-shadow-md mb-2" />
                <div className="text-[44px] font-serif leading-none tracking-tight">
                  <span className="bg-gradient-to-b from-orange-400 to-orange-600 bg-clip-text text-transparent font-semibold">{appName || 'JyotishLink'}</span>
                </div>
              </div>
            ) : (
              <div className="w-[140px] h-[140px] bg-astro-yellow border-4 border-yellow-600/30 rounded-full flex items-center justify-center mb-8 shadow-lg relative">
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="40" stroke="#8B6914" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="28" stroke="#8B6914" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="8" fill="#8B6914" />
                  <path d="M50 34L53 40L59 38L55 43.5L62 46L56 50L62 54L55 56.5L59 62L53 60L50 66L47 60L41 62L45 56.5L38 54L44 50L38 46L45 43.5L41 38L47 40L50 34Z" fill="#8B6914" />
                  <circle cx="10" cy="50" r="4.5" fill="#8B6914" />
                  <circle cx="90" cy="50" r="3" fill="#8B6914" />
                  <circle cx="50" cy="10" r="3.5" fill="#8B6914" />
                  <circle cx="22" cy="22" r="2.5" fill="#8B6914" />
                  <circle cx="22" cy="70" r="3" fill="#8B6914" />
                  <circle cx="78" cy="28" r="5" stroke="#8B6914" strokeWidth="1.5" fill="none" />
                  <circle cx="78" cy="28" r="2" fill="#8B6914" />
                </svg>
              </div>
            )}
            {/* Hidden original slide title since we render it above if logo is present */}
            {!appLogo && <h1 className="text-3xl font-bold text-gray-900 mb-2">{slide.title}</h1>}
            <p className="text-gray-700 text-[15px]">{slide.subtitle}</p>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-[56px] font-black text-gray-900 leading-none tracking-tight">
                {slide.stat}
              </h2>
              <p className="text-gray-700 font-semibold text-[17px] mt-2">{slide.label}</p>
            </div>
            <p className="text-gray-600 text-[15px] max-w-[260px] leading-relaxed">{slide.desc}</p>
          </>
        )}
      </div>

      {/* Bottom section */}
      <div className="w-full px-8 pb-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-8 bg-gray-900'
                  : idx < currentSlide
                  ? 'w-2 bg-gray-700'
                  : 'w-2 bg-gray-400/50'
              }`}
            />
          ))}
        </div>

        {/* Get Started button */}
        <button
          onClick={handleNext}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl text-[16px] tracking-wide shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all duration-200"
        >
          {currentSlide === slides.length - 1 ? 'GET STARTED' : 'NEXT'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

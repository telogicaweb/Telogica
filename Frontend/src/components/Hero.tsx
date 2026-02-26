import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
export const industries = [
  {
    id: 'defence',
    name: 'Defence/Military',
    image: '/hero-slide-1.jpg',
    link: '/products?category=defence',
    category: 'defense',
  },
  {
    id: 'railway',
    name: 'Railway',
    image: '/hero-slide-2.jpg',
    link: '/products?category=railway',
    category: 'railway',
  },
  {
    id: 'telecommunication',
    name: 'Telecommunication',
    image: '/hero-slide-3.jpg',
    link: '/products?category=telecommunication',
    category: 'telecommunication',
  },
];

interface HeroProps {
  onIndustryChange?: (industryId: string) => void;
  onIndustrySelect?: (industryId: string) => void;
}

export default function Hero({ onIndustryChange, onIndustrySelect }: HeroProps) {
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Auto-rotate backgrounds when no industry is hovered
  useEffect(() => {
    if (activeIndustry) return;

    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % industries.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndustry]);

  useEffect(() => {
    const currentIndustryId = activeIndustry || industries[currentBgIndex].id;
    onIndustryChange?.(currentIndustryId);
  }, [activeIndustry, currentBgIndex, onIndustryChange]);

  const getCurrentBgImage = () => {
    if (activeIndustry) {
      const industry = industries.find(i => i.id === activeIndustry);
      return industry?.image || industries[0].image;
    }
    return industries[currentBgIndex].image;
  };

  const handleIndustryHover = (industryId: string) => {
    setActiveIndustry(industryId);
  };

  const handleIndustryLeave = () => {
    setActiveIndustry(null);
  };

  const handleIndustryClick = (industryId: string) => {
    onIndustrySelect?.(industryId);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2a3f8f]">
      {/* Background Images Layer - Clear and Vibrant */}
      <div className="absolute inset-0">
        {industries.map((industry) => (
          <div
            key={industry.id}
            className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${getCurrentBgImage() === industry.image
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-110'
              }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${industry.image})`,
                filter: 'brightness(0.9) contrast(1.1)'
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32">
          <div className="max-w-2xl">
            {/* Hero Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 leading-tight">
              <span className="inline-block bg-amber-500 text-white px-4 py-2 mb-3 animate-fadeIn">
                Superior
              </span>
              <span className="text-white block animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                Test & Measuring
              </span>
              <span className="text-white block animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                Equipment Solutions
              </span>
            </h1>

            {/* Industry Navigation */}
            <div className="space-y-2">
              {industries.map((industry, index) => (
                <div
                  key={industry.id}
                  className="group animate-slideIn"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  onMouseEnter={() => handleIndustryHover(industry.id)}
                  onMouseLeave={handleIndustryLeave}
                >
                  <button
                    type="button"
                    onClick={() => handleIndustryClick(industry.id)}
                    className="flex items-center gap-4 py-4 transition-all duration-300"
                  >
                    {/* "for" text that appears on hover */}
                    <span
                      className={`text-white/80 text-lg font-light transition-all duration-300 ${activeIndustry === industry.id
                        ? 'opacity-100 w-12'
                        : 'opacity-0 w-0'
                        }`}
                      style={{ overflow: 'hidden' }}
                    >
                      for
                    </span>

                    {/* Industry Name */}
                    <span
                      className={`text-xl md:text-2xl font-medium transition-all duration-300 ${activeIndustry === industry.id
                        ? 'text-amber-500 translate-x-2'
                        : 'text-white group-hover:text-white/90'
                        }`}
                    >
                      {industry.name}
                    </span>

                    {/* Connector Line */}
                    <div
                      className={`h-[2px] bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ${activeIndustry === industry.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      style={{
                        width: activeIndustry === industry.id ? '120px' : '0px',
                        boxShadow: activeIndustry === industry.id ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none'
                      }}
                    />

                    {/* Action Button */}
                    <div className="flex items-center ml-auto">
                      {activeIndustry === industry.id ? (
                        <span className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-amber-600 transition-all duration-300 animate-scaleIn">
                          GO <ChevronRight className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center text-white/60 group-hover:border-white/70 group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

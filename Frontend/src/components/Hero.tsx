import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Industry categories with their respective background images
export const industries = [
  {
    id: 'defence',
    name: 'Defence/Military',
    image: '/hero-slide-1.jpg',
    link: '/products?category=defence',
    category: 'defence',
  },
  {
    id: 'telecom',
    name: 'Telecommunication',
    image: '/hero-slide-2.jpg',
    link: '/products?category=telecommunication',
    category: 'telecommunication',
  },
  {
    id: 'railway',
    name: 'Railway',
    image: '/hero-slide-3.jpg',
    link: '/products?category=railway',
    category: 'railway',
  },
];

interface HeroProps {
  onIndustryChange?: (industryId: string) => void;
}

export default function Hero({ onIndustryChange }: HeroProps) {
  const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Auto-rotate background when no industry is hovered
  useEffect(() => {
    if (activeIndustry) return;
    
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % industries.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [activeIndustry]);

  // Notify parent of industry change
  useEffect(() => {
    const currentIndustryId = activeIndustry || industries[currentBgIndex].id;
    onIndustryChange?.(currentIndustryId);
  }, [activeIndustry, currentBgIndex, onIndustryChange]);

  // Get current background image
  const getCurrentBgImage = () => {
    if (activeIndustry) {
      const industry = industries.find(i => i.id === activeIndustry);
      return industry?.image || industries[0].image;
    }
    return industries[currentBgIndex].image;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Images Layer */}
      {industries.map((industry) => (
        <div
          key={industry.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            getCurrentBgImage() === industry.image ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${industry.image})` }}
          />
        </div>
      ))}

      {/* Blue Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/80 via-[#0a1628]/60 to-[#0a1628]/40" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32">
          <div>
            {/* Left Content */}
            <div className="max-w-2xl">
              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                <span className="inline-block bg-amber-500 text-white px-3 py-1 mb-2">
                  Superior
                </span>
                <span className="text-white block">
                  Test & Measuring
                </span>
                <span className="text-white block">
                  Equipment Solutions
                </span>
              </h1>

              {/* Industry Links */}
              <div className="space-y-1">
                {industries.map((industry) => (
                  <div
                    key={industry.id}
                    className="group"
                    onMouseEnter={() => setActiveIndustry(industry.id)}
                    onMouseLeave={() => setActiveIndustry(null)}
                  >
                    <Link
                      to={industry.link}
                      className="flex items-center gap-4 py-3 transition-all duration-300"
                    >
                      {/* "for" prefix - only shown on active */}
                      <span 
                        className={`text-white/60 text-lg transition-all duration-300 w-8 ${
                          activeIndustry === industry.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        for
                      </span>

                      {/* Industry Name */}
                      <span 
                        className={`text-xl md:text-2xl font-medium transition-all duration-300 ${
                          activeIndustry === industry.id 
                            ? 'text-amber-500' 
                            : 'text-white/90 hover:text-white'
                        }`}
                      >
                        {industry.name}
                      </span>

                      {/* Arrow/GO Button */}
                      <div className="ml-auto flex items-center">
                        {activeIndustry === industry.id ? (
                          <span className="flex items-center gap-1 bg-amber-500 text-white px-4 py-2 rounded text-sm font-semibold transition-all duration-300">
                            GO
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white/60 group-hover:border-white/60 group-hover:text-white transition-all duration-300">
                            <ChevronRight className="w-5 h-5" />
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

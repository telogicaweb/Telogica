import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Industry categories with their respective background images
export const industries = [
  {
    id: 'defence',
    name: 'Defence/Military',
    image: '/hero-slide-1.jpg',
    link: '/products?category=Defense',
    category: 'Defense',
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

  useEffect(() => {
    if (activeIndustry) return;
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % industries.length);
    }, 4000);
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

  const isActive = activeIndustry !== null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image Layer */}
      {industries.map((industry) => (
        <div
          key={industry.id}
          className={`absolute inset-0 transition-opacity duration-700 ${getCurrentBgImage() === industry.image ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${industry.image})` }}
          />
        </div>
      ))}

      {/* Grey Transparent Overlay with T-shaped cutout */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <mask id="t-cutout-mask">
            {/* White = overlay shows, Black = transparent (image shows through) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />

            {/* T-shape cutout - FULL WIDTH HORIZONTAL, FULL HEIGHT VERTICAL, CENTERED */}
            {isActive && (
              <>
                {/* Horizontal bar of T - FULL WIDTH from left to right */}
                <rect x="0%" y="0%" width="100%" height="22%" fill="black">
                  <animate
                    attributeName="width"
                    from="0%"
                    to="100%"
                    dur="0.5s"
                    fill="freeze"
                  />
                </rect>
                {/* Vertical bar of T - centered, FULL HEIGHT */}
                <rect x="40%" y="0%" width="28%" height="100%" fill="black">
                  <animate
                    attributeName="height"
                    from="0%"
                    to="100%"
                    dur="0.6s"
                    begin="0.1s"
                    fill="freeze"
                  />
                </rect>
              </>
            )}
          </mask>
        </defs>

        {/* Grey transparent overlay with mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(30, 30, 40, 0.75)"
          mask="url(#t-cutout-mask)"
        />
      </svg>

      {/* Left side gradient for text readability */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-400"
        style={{
          background: isActive
            ? 'linear-gradient(to right, rgba(30, 30, 40, 0.9) 0%, rgba(30, 30, 40, 0.6) 35%, transparent 50%)'
            : 'none',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
              <span className="inline-block bg-amber-500 text-white px-3 py-1 mb-2">
                Superior
              </span>
              <span className="text-white block">Test & Measuring</span>
              <span className="text-white block">Equipment Solutions</span>
            </h1>

            <div className="space-y-3">
              {industries.map((industry) => (
                <div
                  key={industry.id}
                  className="group"
                  onMouseEnter={() => setActiveIndustry(industry.id)}
                  onMouseLeave={() => setActiveIndustry(null)}
                >
                  <Link
                    to={industry.link}
                    className="flex items-center gap-4 py-5 transition-all duration-300"
                  >
                    <span
                      className={`text-white/60 text-lg transition-all duration-300 w-8 ${activeIndustry === industry.id ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                      for
                    </span>

                    <span
                      className={`text-xl md:text-2xl font-medium transition-all duration-300 ${activeIndustry === industry.id
                        ? 'text-amber-500'
                        : 'text-white/90 hover:text-white'
                        }`}
                    >
                      {industry.name}
                    </span>

                    {/* Connector line */}
                    <div
                      className="h-[2px] bg-white/50 transition-all duration-400"
                      style={{ width: activeIndustry === industry.id ? '100px' : '0px' }}
                    />

                    <div className="flex items-center">
                      {activeIndustry === industry.id ? (
                        <span className="flex items-center gap-1 bg-amber-500 text-white px-4 py-2 rounded text-sm font-semibold">
                          GO <ChevronRight className="w-4 h-4" />
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
  );
}

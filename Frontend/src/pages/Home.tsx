import { useEffect, useRef, useState } from 'react';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';

const Home = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [productsMounted, setProductsMounted] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const lastScrollYRef = useRef(0);
  const lastOpenAtRef = useRef(0);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!productsMounted) return;

    const handleScroll = () => {
      const heroZoneThreshold = window.innerHeight * 0.55;
      const now = Date.now();
      const currentY = window.scrollY;
      const isScrollingUp = currentY < lastScrollYRef.current;
      lastScrollYRef.current = currentY;

      // Prevent immediate collapse right after clicking hero navigation.
      const allowAutoHide = now - lastOpenAtRef.current > 900;

      if (allowAutoHide && isScrollingUp && currentY <= heroZoneThreshold) {
        setShowProducts(false);
      }
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [productsMounted]);

  const handleIndustrySelect = (industryId: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    lastOpenAtRef.current = Date.now();
    setSelectedIndustry(industryId);
    setProductsMounted(true);
    setShowProducts(true);
    setScrollTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (showProducts) return;
    if (!productsMounted) return;

    closeTimerRef.current = setTimeout(() => {
      setProductsMounted(false);
      setSelectedIndustry(null);
      closeTimerRef.current = null;
    }, 320);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [showProducts, productsMounted]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Hero onIndustrySelect={handleIndustrySelect} />
      {productsMounted && (
        <div
          className={`transition-all duration-300 ease-out ${
            showProducts ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'
          }`}
        >
          <FeaturedProducts
            focusCategory={selectedIndustry}
            scrollTrigger={scrollTrigger}
            isVisible={true}
          />
        </div>
      )}
    </div>
  );
};

export default Home;

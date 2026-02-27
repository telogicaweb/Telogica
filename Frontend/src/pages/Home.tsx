import { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';

const Home = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleIndustrySelect = (industryId: string) => {
    setSelectedIndustry(industryId);
    setShowProducts(true);
    setScrollTrigger((prev) => prev + 1);
  };

  const handleCloseProducts = () => {
    setShowProducts(false);
    setSelectedIndustry(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Hero onIndustrySelect={handleIndustrySelect} />
      <FeaturedProducts
        focusCategory={selectedIndustry}
        scrollTrigger={scrollTrigger}
        isVisible={showProducts}
        onClose={handleCloseProducts}
      />
    </div>
  );
};

export default Home;

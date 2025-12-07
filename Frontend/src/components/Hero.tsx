import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: 'Manufacturing Excellence',
    subtitle: 'Quality Innovation',
    description: 'For Industrial Applications',
    text: 'Providing nationwide services to industries and government organizations with precision manufacturing and engineering excellence.',
    image: '../hero-slide-1.jpg',
  },
  {
    id: 2,
    title: 'Defense Technology',
    subtitle: 'Advanced Solutions',
    description: 'For National Security',
    text: 'Delivering cutting-edge electronics and communication solutions designed for mission-critical defense applications.',
    image: '../hero-slide-2.jpg',
  },
  {
    id: 3,
    title: 'Precision Engineering',
    subtitle: 'For Critical Systems',
    description: '',
    text: 'Empowering Defence and Telecom sectors with advanced Test & Measuring Equipment. Where innovation meets reliability and performance.',
    image: '../hero-slide-3.jpg',
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </div>

          <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
            <h2 className="text-5xl md:text-7xl font-bold text-center mb-2 max-w-4xl">
              {slide.title}
            </h2>
            <p className="text-2xl md:text-3xl text-center mb-3 max-w-2xl font-semibold">
              {slide.subtitle}
            </p>
            {slide.description && (
              <p className="text-lg md:text-xl text-center mb-4 max-w-2xl text-gray-200">
                {slide.description}
              </p>
            )}
            <p className="text-base md:text-lg text-center mb-12 max-w-3xl text-gray-100 leading-relaxed">
              {slide.text}
            </p>
            <div className="flex gap-6">
              <button className="px-8 py-4 bg-white text-gray-900 font-semibold rounded hover:bg-gray-100 transition-colors">
                Explore Products
              </button>
              <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded hover:bg-white hover:text-gray-900 transition-colors">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all backdrop-blur-sm"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all backdrop-blur-sm"
      >
        <ChevronRight size={32} />
      </button>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

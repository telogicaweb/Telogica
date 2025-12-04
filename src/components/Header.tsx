import { Home, Search, User, ShoppingCart } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-10 text-sm">
            <nav className="flex gap-8">
              <a href="#about" className="text-gray-700 hover:text-gray-900 transition-colors">About US</a>
              <a href="#investors" className="text-gray-700 hover:text-gray-900 transition-colors">INVESTORS</a>
              <a href="#blog" className="text-gray-700 hover:text-gray-900 transition-colors">BLOG</a>
            </nav>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <nav className="flex items-center gap-8">
              <a href="#home" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2">
                <Home size={20} />
                <span className="font-medium">Home</span>
              </a>
              <a href="#products" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">PRODUCTS</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">CONTACT</a>
            </nav>

            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">TELOGICA</h1>
            </a>

            <div className="flex items-center gap-6">
              <button className="text-gray-700 hover:text-gray-900 transition-colors">
                <Search size={22} />
              </button>
              <button className="text-gray-700 hover:text-gray-900 transition-colors">
                <User size={22} />
              </button>
              <button className="text-gray-700 hover:text-gray-900 transition-colors">
                <ShoppingCart size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

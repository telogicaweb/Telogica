import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, User, ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext)!;
  const { cart, quoteItems } = useContext(CartContext)!;
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="border-b border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-10 text-sm">
            <nav className="flex gap-8">
              <Link to="/about" className="text-gray-700 hover:text-gray-900 transition-colors">About US</Link>
              <Link to="/investors" className="text-gray-700 hover:text-gray-900 transition-colors">INVESTORS</Link>
              <Link to="/blog" className="text-gray-700 hover:text-gray-900 transition-colors">BLOG</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900 p-2"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2">
                <Home size={20} />
                <span className="font-medium">Home</span>
              </Link>
              <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">PRODUCTS</Link>
              <Link to="/contact" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">CONTACT</Link>
            </nav>

            {/* Logo */}
            <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/telogica_logo.png" alt="Telogica" className="h-12 md:h-16 w-auto" />
            </Link>

            {/* Icons */}
            <div className="flex items-center gap-4 md:gap-6">
              <button className="text-gray-700 hover:text-gray-900 transition-colors hidden sm:block" aria-label="Search">
                <Search size={22} />
              </button>
              
              {user ? (
                <div className="flex items-center gap-2 md:gap-4">
                  <Link to={user.role === 'admin' ? '/admin' : '/user-dashboard'} className="text-gray-700 hover:text-gray-900 transition-colors" aria-label="Dashboard">
                    <User size={22} />
                  </Link>
                  <button onClick={handleLogout} className="text-gray-700 hover:text-gray-900 transition-colors" aria-label="Logout">
                    <LogOut size={22} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium">
                  Login
                </Link>
              )}

              <Link to="/cart" className="text-gray-700 hover:text-gray-900 transition-colors relative" aria-label="Cart">
                <ShoppingCart size={22} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Link>
              
              <Link to="/quote" className="text-gray-700 hover:text-gray-900 transition-colors font-bold text-sm hidden sm:block">
                QUOTE ({quoteItems.length})
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Home</Link>
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Products</Link>
            <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Contact</Link>
            <Link to="/quote" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Quote Request ({quoteItems.length})
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

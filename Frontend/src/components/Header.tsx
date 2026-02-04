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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-100 hover:text-white p-2"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Logo */}
            <Link
              to="/"
              className="relative flex items-center gap-2 group"
              aria-label="Telogica"
            >
              <span className="relative h-14 w-[200px]">
                <img
                  src="../logohead.png"
                  alt="Telogica"
                  className="absolute inset-0 h-14 w-auto opacity-100 transition-all duration-500 ease-out group-hover:opacity-0 group-hover:-translate-y-1 group-hover:scale-95"
                />
                <img
                  src="../telogica_logo.png"
                  alt="Telogica"
                  className="absolute inset-0 h-14 w-auto opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-105"
                />
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/" className="text-gray-100 hover:text-white transition-colors flex items-center gap-2">
                <Home size={18} />
                <span className="font-medium">Home</span>
              </Link>
              <Link to="/products" className="text-gray-100 hover:text-white transition-colors font-medium">Products</Link>
              <Link to="/contact" className="text-gray-100 hover:text-white transition-colors font-medium">Contact</Link>
              <Link to="/about" className="text-gray-100 hover:text-white transition-colors">About Us</Link>
              <Link to="/investors" className="text-gray-100 hover:text-white transition-colors">Investors</Link>
              <Link to="/blog" className="text-gray-100 hover:text-white transition-colors">Blog</Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <button className="text-gray-100 hover:text-white transition-colors hidden sm:block" aria-label="Search">
                <Search size={20} />
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={user.role === 'admin' ? '/admin' : user.role === 'retailer' ? '/retailer-dashboard' : '/user-dashboard'}
                    className="text-gray-100 hover:text-white transition-colors"
                    aria-label="Dashboard"
                  >
                    <User size={20} />
                  </Link>
                  <button onClick={handleLogout} className="text-gray-100 hover:text-white transition-colors" aria-label="Logout">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-gray-100 hover:text-white transition-colors text-sm font-medium">
                  Login
                </Link>
              )}

              <Link to="/cart" className="text-gray-100 hover:text-white transition-colors relative" aria-label="Cart">
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Link>

              <Link to="/quote" className="text-gray-100 hover:text-white transition-colors font-bold text-xs hidden sm:block">
                QUOTE ({quoteItems.length})
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-gray-800">Home</Link>
              <Link to="/products" className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-gray-800">Products</Link>
              <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-gray-800">Contact</Link>
              <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-gray-800">About Us</Link>
              <Link to="/investors" className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-gray-800">Investors</Link>
              <Link to="/blog" className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-gray-800">Blog</Link>
              <Link to="/quote" className="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-gray-800">
                Quote Request ({quoteItems.length})
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Spacer to offset the fixed header so page content does not sit underneath it.
          Mobile/Desktop: header height = h-14 (56px)
          Using a spacer here avoids adding <br/> to every page and centralizes the layout fix. */}
      <div className="h-20 w-full" aria-hidden="true" />
    </>
  );
}

import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, User, LogOut, Menu, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext)!;
  const { quoteItems } = useContext(CartContext)!;
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Auto-close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside of the header
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinkClass = (path: string) => {
    const isActive = currentPath === path;
    return isActive
      ? 'font-bold text-[#1a2b68] no-underline'
      : 'font-semibold text-gray-500 hover:text-[#1a2b68] no-underline';
  };

  const getMobileNavLinkClass = (path: string) => {
    const isActive = currentPath === path;
    return isActive
      ? 'block px-3 py-2 rounded-md text-base font-bold text-[#1a2b68] bg-blue-50/50 no-underline'
      : 'block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[#1a2b68] hover:bg-gray-50 no-underline';
  };

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900"
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
              <Link to="/" className={`flex items-center gap-2 ${getNavLinkClass('/')}`}>
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link to="/products" className={getNavLinkClass('/products')}>Products</Link>
              <Link to="/contact" className={getNavLinkClass('/contact')}>Contact</Link>
              <Link to="/about" className={getNavLinkClass('/about')}>About Us</Link>
              <Link to="/investors" className={getNavLinkClass('/investors')}>Investors</Link>
              <Link to="/clients" className={getNavLinkClass('/clients')}>Clients</Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-4">
              {/* <button className="hidden sm:block text-gray-600 hover:text-gray-900" aria-label="Search">
                <Search size={20} />
              </button> */}

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={user.role === 'admin' ? '/admin' : user.role === 'retailer' ? '/retailer-dashboard' : '/user-dashboard'}
                    className="text-gray-500 hover:text-[#1a2b68] no-underline"
                    aria-label="Dashboard"
                  >
                    <User size={20} />
                  </Link>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-[#1a2b68]" aria-label="Logout">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-[#1a2b68] no-underline">
                  Login
                </Link>
              )}

              <Link to="/quote" className={`font-bold text-xs hidden sm:block no-underline ${
                currentPath === '/quote'
                  ? 'text-[#1a2b68]'
                  : 'text-gray-500 hover:text-[#1a2b68]'
              }`}>
                QUOTE ({quoteItems.length})
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className={getMobileNavLinkClass('/')}>Home</Link>
              <Link to="/products" className={getMobileNavLinkClass('/products')}>Products</Link>
              <Link to="/contact" className={getMobileNavLinkClass('/contact')}>Contact</Link>
              <Link to="/about" className={getMobileNavLinkClass('/about')}>About Us</Link>
              <Link to="/investors" className={getMobileNavLinkClass('/investors')}>Investors</Link>
              <Link to="/clients" className={getMobileNavLinkClass('/clients')}>Clients</Link>
              <Link to="/quote" className={getMobileNavLinkClass('/quote')}>
                Quote Request ({quoteItems.length})
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Spacer to offset the fixed header so page content does not sit underneath it. */}
      <div className="h-20 w-full" aria-hidden="true" />
    </>
  );
}

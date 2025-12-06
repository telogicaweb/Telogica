import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Info,
  TrendingUp,
  BookOpen,
  Phone,
  LogIn,
  UserPlus,
  ShoppingBag,
  ShoppingCart,
  FileText,
  ShieldCheck,
  LayoutDashboard,
  Store,
  Database,
  Globe,
  Shield,
  Factory,
  Server,
  Map as MapIcon,
  ChevronRight,
  ArrowRight,
  Activity,
  Users,
  FileBarChart,
  Search,
  ExternalLink,
  Zap,
  Cpu,
  Network
} from 'lucide-react';

// --- Types & Data ---

interface SiteLink {
  label: string;
  to: string;
  icon: React.ElementType;
  description?: string;
  tags?: string[];
}

interface SiteSection {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string; // Tailwind text color class
  bg: string;    // Tailwind bg color class
  gradient: string; // Tailwind gradient class
  links: SiteLink[];
}

const SiteMap = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const productCategories = [
    { label: 'Telecommunication', anchor: '/products#Telecommunication', icon: Globe, description: 'Next-gen telecom infrastructure solutions.' },
    { label: 'Defence', anchor: '/products#Defence', icon: Shield, description: 'Mission-critical defence technology.' },
    { label: 'Manufacturing', anchor: '/products#Manufacturing', icon: Factory, description: 'Smart manufacturing and automation.' },
  ];

  const allSections: SiteSection[] = [
    {
      title: 'Corporate & Brand',
      description: 'Who we are and what drives us forward.',
      icon: Home,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      gradient: 'from-blue-500 to-indigo-600',
      links: [
        { label: 'Home', to: '/', icon: Home, description: 'The landing page and overview.', tags: ['Main'] },
        { label: 'About Us', to: '/about', icon: Info, description: 'Our history, mission, and values.', tags: ['Company'] },
        { label: 'Investors', to: '/investors', icon: TrendingUp, description: 'Financial reports and investor relations.', tags: ['Finance'] },
        { label: 'Blog & Insights', to: '/blog', icon: BookOpen, description: 'Latest news and tech articles.', tags: ['News'] },
        { label: 'Contact Us', to: '/contact', icon: Phone, description: 'Get in touch with our team.', tags: ['Support'] },
      ]
    },
    {
      title: 'Products & Solutions',
      description: 'Explore our comprehensive catalog.',
      icon: Cpu,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      gradient: 'from-indigo-500 to-purple-600',
      links: [
        { label: 'Product Portal', to: '/products', icon: ShoppingBag, description: 'Browse all products and services.', tags: ['Shop'] },
        ...productCategories.map(cat => ({ 
          label: cat.label, 
          to: cat.anchor, 
          icon: cat.icon, 
          description: cat.description,
          tags: ['Category']
        })),
      ]
    },
    {
      title: 'Customer Zone',
      description: 'Manage your account and orders.',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      gradient: 'from-emerald-500 to-teal-600',
      links: [
        { label: 'Login', to: '/login', icon: LogIn, description: 'Access your account.', tags: ['Auth'] },
        { label: 'Register', to: '/register', icon: UserPlus, description: 'Create a new account.', tags: ['Auth'] },
        { label: 'My Dashboard', to: '/user-dashboard', icon: LayoutDashboard, description: 'View orders and profile.', tags: ['User'] },
        { label: 'Shopping Cart', to: '/cart', icon: ShoppingCart, description: 'Review selected items.', tags: ['Shop'] },
        { label: 'Request Quote', to: '/quote', icon: FileText, description: 'Get custom pricing.', tags: ['B2B'] },
      ]
    },
    {
      title: 'Support & Legal',
      description: 'Resources, warranties, and policies.',
      icon: ShieldCheck,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      gradient: 'from-orange-500 to-red-600',
      links: [
        { label: 'Warranty Registration', to: '/warranty', icon: ShieldCheck, description: 'Register your product warranty.', tags: ['Service'] },
        { label: 'Privacy Policy', to: '/privacy-policy', icon: FileText, description: 'How we handle your data.', tags: ['Legal'] },
        { label: 'Terms & Conditions', to: '/terms-and-conditions', icon: FileText, description: 'Usage terms and agreements.', tags: ['Legal'] },
        { label: 'Site Map', to: '/site-map', icon: MapIcon, description: 'You are here.', tags: ['Nav'] },
      ]
    },
    {
      title: 'Partners & Admin',
      description: 'Restricted access areas.',
      icon: Database,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      gradient: 'from-slate-700 to-slate-900',
      links: [
        { label: 'Retailer Dashboard', to: '/retailer-dashboard', icon: Store, description: 'Portal for authorized retailers.', tags: ['B2B'] },
        { label: 'Retailer Inventory', to: '/retailer-inventory', icon: Database, description: 'Manage stock and orders.', tags: ['B2B'] },
        { label: 'Admin Dashboard', to: '/admin', icon: Activity, description: 'System administration.', tags: ['Internal'] },
        { label: 'Reports', to: '/admin/report-management', icon: FileBarChart, description: 'Analytics and reporting.', tags: ['Internal'] },
      ]
    }
  ];

  // Filter logic
  const filteredSections = useMemo(() => {
    if (!searchQuery) return allSections;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    return allSections.map(section => ({
      ...section,
      links: section.links.filter(link => 
        link.label.toLowerCase().includes(lowerQuery) || 
        link.description?.toLowerCase().includes(lowerQuery) ||
        link.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    })).filter(section => section.links.length > 0);
  }, [searchQuery, allSections]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- Premium Header Section --- */}
      <div className="relative bg-[#0B1120] text-white overflow-hidden pt-32 pb-24">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]"></div>
          <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute top-[60%] right-[30%] w-1 h-1 bg-white/20 rounded-full animate-ping delay-700"></div>
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-700/50 text-blue-300 text-xs font-medium mb-6 backdrop-blur-sm">
            <Network size={12} />
            <span>System Architecture</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200">
            Site Map
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Navigate the entire Telogica ecosystem. From enterprise solutions to customer support, find your destination instantly.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
              <Search className="text-gray-400 ml-4 w-6 h-6" />
              <input 
                type="text"
                placeholder="Search for pages, products, or services..."
                className="w-full bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 text-lg px-4 py-3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10 relative z-20">
        
        {/* Quick Stats / Highlights (Bento Grid Style) */}
        {!searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Link to="/products" className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">New Arrivals</h3>
                <p className="text-gray-500 mb-4">Check out the latest in telecom tech.</p>
                <span className="text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore <ArrowRight size={16} />
                </span>
              </div>
            </Link>

            <Link to="/quote" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-8 shadow-lg text-white hover:shadow-xl transition-all duration-300 md:col-span-2">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between h-full">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-4">
                    <Activity size={12} />
                    <span>B2B Services</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Request a Quote</h3>
                  <p className="text-blue-100 max-w-md">Get tailored pricing for bulk orders and enterprise solutions directly from our sales team.</p>
                </div>
                <div className="mt-6 md:mt-0 bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/30 transition-colors">
                  <ArrowRight size={32} />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* --- The Map Grid --- */}
        <div className="space-y-12">
          {filteredSections.length > 0 ? (
            <div className="masonry-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSections.map((section, idx) => (
                <div 
                  key={idx} 
                  className="group flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className={`p-6 border-b border-gray-50 bg-gradient-to-r ${section.bg} bg-opacity-50`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.gradient} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                        <section.icon size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                        <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
                          {section.links.length} Links
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Links List */}
                  <div className="p-6 flex-1">
                    <p className="text-sm text-gray-500 mb-6">{section.description}</p>
                    <ul className="space-y-4">
                      {section.links.map((link, linkIdx) => (
                        <li key={linkIdx}>
                          <Link 
                            to={link.to} 
                            className="flex items-start group/link p-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className={`mt-1 mr-3 text-gray-400 group-hover/link:${section.color} transition-colors`}>
                              <link.icon size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700 font-semibold group-hover/link:text-gray-900 transition-colors">
                                  {link.label}
                                </span>
                                <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 text-gray-400 transition-opacity" />
                              </div>
                              {link.description && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                  {link.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Card Footer Decoration */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${section.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-gray-400 w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No pages found</h3>
              <p className="text-gray-500">We couldn't find any pages matching "{searchQuery}".</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* --- Footer CTA --- */}
        <div className="mt-24 bg-gray-900 rounded-3xl overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
          
          <div className="relative z-10 px-8 py-16 md:p-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Still can't find what you need?</h2>
              <p className="text-gray-400 text-lg">Our support team is available 24/7 to assist you with navigation, product inquiries, or technical support.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/contact" 
                className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                Contact Support
              </Link>
              <Link 
                to="/" 
                className="px-8 py-4 bg-transparent border border-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SiteMap;

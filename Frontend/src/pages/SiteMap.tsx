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
  Network,
  Sparkles,
  TrendingDown,
  Clock,
  Star
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- Ultra Premium Header Section --- */}
      <div className="relative bg-gradient-to-br from-[#0B1120] via-[#1a1f3a] to-[#0B1120] text-white overflow-hidden pt-32 pb-28">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[90px] animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute top-[60%] right-[30%] w-1 h-1 bg-white/20 rounded-full animate-ping" style={{animationDelay: '700ms'}}></div>
          <div className="absolute bottom-[40%] left-[40%] w-1.5 h-1.5 bg-blue-300/20 rounded-full animate-ping" style={{animationDelay: '1400ms'}}></div>
          
          {/* Premium Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          {/* Animated Gradient Orbs */}
          <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[15%] w-80 h-80 bg-gradient-to-r from-indigo-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-700/50 text-blue-200 text-sm font-semibold mb-8 backdrop-blur-md shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
            <Sparkles size={16} className="text-blue-300 animate-pulse" />
            <span>Premium Navigation System</span>
            <Network size={14} className="text-blue-400" />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200 drop-shadow-2xl">
            Site Map
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Navigate the entire <span className="font-bold text-white">Telogica</span> ecosystem with precision. 
            From enterprise solutions to customer support, <span className="text-blue-300">find your destination instantly</span>.
          </p>

          {/* Premium Search Bar */}
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl ring-1 ring-white/10">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl ml-2">
                <Search className="text-white w-5 h-5" />
              </div>
              <input 
                type="text"
                placeholder="Search for pages, products, or services..."
                className="w-full bg-transparent border-none text-white placeholder-gray-300 focus:ring-0 text-lg px-6 py-4 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2 mr-2 text-gray-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span><span className="text-white font-bold">{filteredSections.reduce((acc, s) => acc + s.links.length, 0)}</span> Pages Available</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={16} className="text-blue-400" />
              <span>Updated Daily</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Star size={16} className="text-yellow-400" />
              <span>Enterprise Grade</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 -mt-16 relative z-20">
        
        {/* Quick Stats / Highlights (Premium Bento Grid) */}
        {!searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-20">
            {/* Featured Card 1 - New Arrivals */}
            <Link to="/products" className="md:col-span-5 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-blue-50 p-10 shadow-xl border border-blue-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out blur-2xl"></div>
              <div className="relative z-10">
                <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg">
                  <Zap size={28} />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                  <Sparkles size={12} />
                  <span>TRENDING NOW</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">New Arrivals</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">Discover the latest innovations in telecommunication technology and defense systems.</p>
                <span className="inline-flex items-center gap-2 text-blue-600 font-bold group-hover:gap-4 transition-all">
                  Explore Products <ArrowRight size={20} />
                </span>
              </div>
            </Link>

            {/* Featured Card 2 - Request Quote (Large) */}
            <Link to="/quote" className="md:col-span-7 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 p-10 shadow-2xl text-white hover:shadow-indigo-500/50 hover:-translate-y-2 transition-all duration-500">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between h-full gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold mb-6 backdrop-blur-sm">
                    <Activity size={14} />
                    <span>B2B ENTERPRISE</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black mb-4">Request a Quote</h3>
                  <p className="text-blue-100 text-lg max-w-lg leading-relaxed">Get tailored pricing for bulk orders and enterprise solutions directly from our specialized sales team.</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">Custom Pricing</div>
                    <div className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">Volume Discounts</div>
                    <div className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">24/7 Support</div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-5 rounded-3xl hover:bg-white/30 transition-all duration-300 group-hover:scale-110 shadow-2xl">
                  <ArrowRight size={40} />
                </div>
              </div>
            </Link>

            {/* Mini Card 1 - Customer Support */}
            <div className="md:col-span-4 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-lg border border-emerald-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Phone size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">24/7 Support</h4>
                  <p className="text-xs text-gray-600">Always here to help</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Get instant assistance from our expert team.</p>
            </div>

            {/* Mini Card 2 - Secure Platform */}
            <div className="md:col-span-4 relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 to-red-50 p-8 shadow-lg border border-orange-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Secure Platform</h4>
                  <p className="text-xs text-gray-600">Enterprise-grade security</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Your data protected with military-grade encryption.</p>
            </div>

            {/* Mini Card 3 - Fast Delivery */}
            <div className="md:col-span-4 relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 p-8 shadow-lg border border-purple-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Fast Delivery</h4>
                  <p className="text-xs text-gray-600">Nationwide shipping</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Quick fulfillment for all your orders.</p>
            </div>
          </div>
        )}

        {/* --- The Premium Map Grid --- */}
        <div className="space-y-12">
          {filteredSections.length > 0 ? (
            <>
              {/* Section Counter */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Navigate to Your Destination</h2>
                  <p className="text-gray-600 mt-2">Browse {filteredSections.length} categories with {filteredSections.reduce((acc, s) => acc + s.links.length, 0)} total pages</p>
                </div>
                {searchQuery && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {filteredSections.reduce((acc, s) => acc + s.links.length, 0)} results for "{searchQuery}"
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSections.map((section, idx) => (
                  <div 
                    key={idx} 
                    className="group flex flex-col bg-white rounded-3xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-gray-200 hover:-translate-y-2 transition-all duration-500"
                    style={{animationDelay: `${idx * 100}ms`}}
                  >
                    {/* Premium Card Header with Glassmorphism */}
                    <div className={`relative p-8 border-b-2 border-gray-50 bg-gradient-to-br ${section.bg} overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/50 to-transparent rounded-full blur-2xl"></div>
                      <div className="relative z-10 flex items-start gap-5">
                        <div className={`flex-shrink-0 w-16 h-16 rounded-3xl bg-gradient-to-br ${section.gradient} text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                          <section.icon size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-black text-gray-900 mb-2">{section.title}</h2>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${section.color} bg-white/80 backdrop-blur-sm shadow-sm`}>
                              {section.links.length} Pages
                            </div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Links List with Enhanced Hover States */}
                    <div className="p-8 flex-1 bg-gradient-to-b from-white to-gray-50/50">
                      <p className="text-sm text-gray-600 mb-8 leading-relaxed font-medium">{section.description}</p>
                      <ul className="space-y-3">
                        {section.links.map((link, linkIdx) => (
                          <li key={linkIdx}>
                            <Link 
                              to={link.to} 
                              className="flex items-start group/link p-4 -mx-4 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 border-2 border-transparent hover:border-gray-100"
                            >
                              <div className={`mt-1 mr-4 p-2 rounded-xl bg-gray-100 text-gray-500 group-hover/link:bg-gradient-to-br group-hover/link:${section.gradient} group-hover/link:text-white transition-all duration-300 shadow-sm`}>
                                <link.icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-gray-700 font-bold group-hover/link:text-gray-900 transition-colors truncate">
                                    {link.label}
                                  </span>
                                  <ExternalLink size={14} className="flex-shrink-0 opacity-0 group-hover/link:opacity-100 text-gray-400 group-hover/link:text-blue-600 transition-all" />
                                </div>
                                {link.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                    {link.description}
                                  </p>
                                )}
                                {link.tags && (
                                  <div className="flex gap-1 mt-2">
                                    {link.tags.slice(0, 2).map((tag, i) => (
                                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Premium Footer Accent */}
                    <div className={`h-2 w-full bg-gradient-to-r ${section.gradient} opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl shadow-lg border-2 border-gray-100">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Search className="text-gray-400 w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">No Pages Found</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                We couldn't find any pages matching <span className="font-bold text-gray-900">"{searchQuery}"</span>. 
                Try adjusting your search terms.
              </p>
              <button 
                onClick={() => setSearchQuery('')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Clear Search & Show All
              </button>
            </div>
          )}
        </div>

        {/* --- Ultra Premium Footer CTA --- */}
        <div className="mt-28 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-3xl overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl -mr-40 -mt-40 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/10 via-pink-600/10 to-transparent rounded-full blur-3xl -ml-32 -mb-32 animate-pulse"></div>
          
          <div className="relative z-10 px-10 py-20 md:p-20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-bold mb-6 backdrop-blur-sm">
                <Sparkles size={16} className="text-yellow-300" />
                <span>PREMIUM SUPPORT</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                Still can't find what you need?
              </h2>
              <p className="text-gray-300 text-xl mb-8 leading-relaxed">
                Our expert support team is available <span className="text-white font-bold">24/7</span> to assist you with navigation, product inquiries, technical support, or any questions you may have.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Chat Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>Average Response: 2 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" />
                  <span>4.9/5 Rating</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <Link 
                to="/contact" 
                className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 hover:scale-105 transform"
              >
                <Phone size={24} />
                Contact Support
              </Link>
              <Link 
                to="/" 
                className="px-10 py-5 bg-transparent border-2 border-gray-700 text-white rounded-2xl font-black text-lg hover:bg-gray-800 hover:border-gray-600 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Home size={24} />
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

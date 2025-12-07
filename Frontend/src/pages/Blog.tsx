import { useState, useEffect } from 'react';
import { Calendar, User, Tag, ArrowRight, Clock, TrendingUp, Sparkles, BookOpen, Search, Filter, Eye, Heart, Share2, Bookmark, ChevronRight } from 'lucide-react';
import api from '../api';

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  image: string;
  readTime: string;
  publishDate: string;
  isFeatured: boolean;
}

const mockPosts: BlogPost[] = [
  {
    _id: '1',
    title: '5G Revolution in Indian Railways: A Game Changer',
    excerpt: 'Exploring how 5G technology is transforming railway operations, passenger experience, and safety protocols across Indian railway networks.',
    content: '',
    author: 'Dr. Vikram Singh',
    publishDate: '2024-12-01',
    category: 'Railway',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
    readTime: '5 min read',
    isFeatured: true
  },
  {
    _id: '2',
    title: 'Cybersecurity in Defense Communications',
    excerpt: 'Understanding the critical importance of encrypted communication systems in modern defense operations and how Telogica is leading the charge.',
    content: '',
    author: 'Col. Rajesh Kumar (Retd.)',
    publishDate: '2024-11-28',
    category: 'Defence',
    image: 'https://images.unsplash.com/photo-1580584126903-c17d41830450?w=800',
    readTime: '7 min read',
    isFeatured: false
  },
  {
    _id: '3',
    title: 'The Future of Smart Cities: Telecom Infrastructure',
    excerpt: 'How advanced telecom infrastructure is becoming the backbone of smart city initiatives across India, enabling IoT and connected services.',
    content: '',
    author: 'Priya Sharma',
    publishDate: '2024-11-25',
    category: 'Telecom',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',
    readTime: '6 min read',
    isFeatured: false
  },
  {
    _id: '4',
    title: 'AI-Powered Predictive Maintenance in Railways',
    excerpt: 'Leveraging artificial intelligence and machine learning to predict equipment failures and optimize maintenance schedules in railway operations.',
    content: '',
    author: 'Arjun Patel',
    publishDate: '2024-11-20',
    category: 'Railway',
    image: 'https://images.unsplash.com/photo-1527684651001-731c474bbb5a?w=800',
    readTime: '8 min read',
    isFeatured: false
  },
  {
    _id: '5',
    title: 'Edge Computing in Tactical Defense Systems',
    excerpt: 'Exploring the role of edge computing in enabling real-time decision making for tactical defense applications in challenging environments.',
    content: '',
    author: 'Maj. Ananya Reddy',
    publishDate: '2024-11-15',
    category: 'Defence',
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800',
    readTime: '6 min read',
    isFeatured: false
  },
  {
    _id: '6',
    title: 'Building Resilient Telecom Networks',
    excerpt: 'Best practices and technologies for creating robust, disaster-resistant telecom infrastructure that ensures uninterrupted connectivity.',
    content: '',
    author: 'Suresh Menon',
    publishDate: '2024-11-10',
    category: 'Telecom',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    readTime: '5 min read',
    isFeatured: false
  }
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const categories = ['All', 'Telecom', 'Defence', 'Railway'];

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      const response = await api.get('/api/blog');
      if (response.data.length > 0) {
        setBlogPosts(response.data);
      } else {
        setBlogPosts(mockPosts);
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      setBlogPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <div className="text-xl text-gray-600 font-semibold">Loading amazing content...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50">
      {/* Ultra Premium Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] text-white overflow-hidden pt-32 pb-32">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/15 blur-[140px] animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-pink-600/10 blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-purple-300/40 rounded-full animate-ping"></div>
          <div className="absolute top-[70%] right-[25%] w-2 h-2 bg-pink-300/30 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-[30%] left-[40%] w-2.5 h-2.5 bg-indigo-300/30 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-700/50 text-purple-200 text-sm font-bold mb-8 backdrop-blur-md shadow-2xl">
              <Sparkles size={18} className="text-purple-300 animate-pulse" />
              <span>INDUSTRY INSIGHTS & INNOVATIONS</span>
              <BookOpen size={16} className="text-purple-400" />
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-pink-200 drop-shadow-2xl leading-tight">
              Telogica Blog
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-300 mb-12 leading-relaxed font-light">
              Discover cutting-edge <span className="font-bold text-white">insights</span>, innovations, and industry trends from our <span className="text-purple-300">world-class experts</span>
            </p>

            {/* Premium Search Bar */}
            <div className="max-w-3xl mx-auto relative group mb-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-1000 animate-pulse"></div>
              <div className="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3.5 rounded-xl ml-2">
                  <Search className="text-white w-5 h-5" />
                </div>
                <input 
                  type="text"
                  placeholder="Search articles by title, author, or topic..."
                  className="w-full bg-transparent border-none text-white placeholder-gray-300 focus:ring-0 text-lg px-6 py-4 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-2 mr-2 text-gray-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                <span><span className="text-white font-bold">{blogPosts.length}</span> Expert Articles</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <TrendingUp size={18} className="text-purple-400" />
                <span>Updated Weekly</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Sparkles size={18} className="text-yellow-400" />
                <span>Industry Leaders</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-20 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl shadow-lg">
              <Filter className="text-white w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Filter by Category</h3>
              <p className="text-sm text-gray-600">Explore articles in your area of interest</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`group relative px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md'
                }`}
              >
                {selectedCategory === category && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {category}
                  {selectedCategory === category && <ChevronRight size={18} />}
                </span>
              </button>
            ))}
          </div>
          {filteredPosts.length > 0 && (
            <div className="mt-6 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <p className="text-sm text-purple-900 font-semibold">
                <span className="text-2xl font-black">{filteredPosts.length}</span> {filteredPosts.length === 1 ? 'article' : 'articles'} found
                {searchQuery && <span className="ml-1">for "{searchQuery}"</span>}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Post - Premium Design */}
      {selectedCategory === 'All' && !searchQuery && blogPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-2">Featured Article</h2>
            <p className="text-gray-600 text-lg">Our top pick this week</p>
          </div>
          <div className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100 hover:shadow-purple-200/50 transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-pink-600/0 to-purple-600/0 group-hover:from-purple-600/5 group-hover:via-pink-600/5 group-hover:to-purple-600/5 transition-all duration-500"></div>
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative h-96 lg:h-full overflow-hidden">
                <img 
                  src={blogPosts[0].image} 
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute top-6 left-6 flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-black shadow-lg flex items-center gap-2">
                    <Sparkles size={16} />
                    FEATURED
                  </span>
                  <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-sm font-bold shadow-lg">
                    {blogPosts[0].category}
                  </span>
                </div>
              </div>
              <div className="relative p-10 lg:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full font-semibold">
                    <Clock size={16} />
                    <span>{blogPosts[0].readTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye size={16} className="text-purple-600" />
                    <span className="font-semibold">Trending</span>
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight group-hover:text-purple-900 transition-colors">
                  {blogPosts[0].title}
                </h2>
                <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {blogPosts[0].author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-500" />
                        <span className="font-bold text-gray-900">{blogPosts[0].author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>{formatDate(blogPosts[0].publishDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                    Read Full Article <ArrowRight size={22} />
                  </button>
                  <button className="p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
                    <Bookmark size={22} className="text-gray-700" />
                  </button>
                  <button className="p-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors">
                    <Share2 size={22} className="text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Premium Blog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-3">
            {selectedCategory === 'All' && !searchQuery ? 'Latest Articles' : 
             searchQuery ? `Search Results` :
             `${selectedCategory} Articles`}
          </h2>
          <p className="text-gray-600 text-lg">
            {selectedCategory === 'All' && !searchQuery ? 'Stay updated with the latest industry insights' :
             searchQuery ? `Articles matching your search` :
             `Expert insights in ${selectedCategory}`}
          </p>
        </div>
        
        {filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(selectedCategory === 'All' && !searchQuery ? 1 : 0).map((post, index) => (
              <article 
                key={post._id} 
                className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 border-gray-100 hover:border-purple-200 flex flex-col hover:-translate-y-2"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating Category Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-4 py-2 bg-white/95 backdrop-blur-sm text-gray-900 rounded-full text-xs font-black shadow-xl border-2 border-white">
                      {post.category}
                    </span>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white transition-colors">
                      <Eye size={16} />
                      Read
                    </button>
                    <button className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors">
                      <Heart size={16} className="text-red-500" />
                    </button>
                    <button className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors">
                      <Share2 size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col">
                  {/* Meta Info */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full font-semibold">
                      <Clock size={14} />
                      {post.readTime}
                    </div>
                    <Tag size={14} className="text-purple-600" />
                    <span className="text-xs text-gray-600 font-medium">{post.category}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight group-hover:text-purple-900 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-700 mb-6 line-clamp-3 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  {/* Author & Date */}
                  <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {post.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-gray-500" />
                          <span className="text-sm font-bold text-gray-900">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar size={12} />
                          <span>{formatDate(post.publishDate)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-purple-600 hover:text-purple-800 transition-colors group/arrow">
                      <ArrowRight size={24} className="transform group-hover/arrow:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl shadow-lg border-2 border-gray-100">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Search className="text-gray-400 w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">No Articles Found</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              We couldn't find any articles matching your criteria. Try adjusting your filters or search terms.
            </p>
            <button 
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* Ultra Premium Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 rounded-3xl overflow-hidden shadow-2xl">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-pink-600/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 p-12 md:p-20 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-bold mb-8 backdrop-blur-sm">
              <Sparkles size={16} className="text-yellow-300" />
              <span>STAY INFORMED</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get the latest <span className="font-bold text-white">cutting-edge insights</span>, industry trends, and technology updates delivered directly to your inbox every week
            </p>
            
            <div className="max-w-2xl mx-auto mb-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="relative w-full px-6 py-5 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl text-lg"
                  />
                </div>
                <button className="bg-white text-purple-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-white/20 transform hover:-translate-y-1 hover:scale-105">
                  Subscribe Now
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Weekly Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-300" />
                <span>Exclusive Content</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>10,000+ Subscribers</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

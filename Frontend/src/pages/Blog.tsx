
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Clock, BookOpen, TrendingUp, Sparkles, Search, Filter, Bookmark, Share2, ChevronRight } from 'lucide-react';
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
    window.scrollTo(0, 0);
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    try {
      const response = await api.get('/api/blog');
      if (response.data && response.data.length > 0) {
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
      <div className="min-h-screen bg-[#f5f5f7] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-3"></div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading amazing insights...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Combined Header (Breadcrumbs + Hero Banner) */}
      <section className="relative bg-gradient-to-br from-[#621180] via-[#220d57] to-[#9c125a] text-white pt-24 pb-12 border-b border-[#621180]/20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col">
          {/* Integrated Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] mb-8">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">Blog</span>
          </div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1.2 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 rounded-full border border-white/5 backdrop-blur-md">
              <BookOpen className="w-3 h-3 text-blue-400 mr-1.5" />
              <span>Industry Insights & Innovations</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-4 leading-tight">
              Telogica Blog
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-indigo-200/80 mt-3 max-w-2xl mx-auto leading-relaxed font-light">
              Discover cutting-edge insights, innovations, and industry trends from our world-class experts
            </p>

            {/* Minimal search box */}
            <div className="max-w-xl mx-auto mt-6 relative">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all shadow-sm">
                <Search className="text-gray-400 w-4 h-4 mr-2" />
                <input
                  type="text"
                  placeholder="Search articles by title, author, or topic..."
                  className="w-full bg-transparent border-none text-xs text-white placeholder-gray-400 focus:ring-0 p-1 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-[10px] text-gray-400 mt-6 flex-wrap font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{blogPosts.length} Expert Articles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>Updated Weekly</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Industry Leaders</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Filter by Category</h3>
              <p className="text-[10px] text-gray-500 font-medium">Explore articles in your area of interest</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-all duration-200 ${selectedCategory === category
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

      </section>

      {/* Featured Article */}
      {selectedCategory === 'All' && !searchQuery && blogPosts.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-1 w-8 bg-indigo-600 rounded"></span>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Featured Article</h3>
            <span className="text-[9px] text-gray-500 font-mono bg-white shadow-sm border border-gray-100 py-0.5 px-2 rounded-full uppercase tracking-wider font-bold">
              Our Pick
            </span>
          </div>

          <div className="bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 lg:grid lg:grid-cols-12 rounded-xl group hover:shadow-xl hover:scale-[1.005] transition-all duration-300">
            {/* Image Container */}
            <div className="relative h-64 sm:h-80 lg:h-full lg:col-span-6 overflow-hidden bg-gray-100">
              <img
                src={blogPosts[0].image}
                alt={blogPosts[0].title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-2.5 py-1 bg-amber-500 text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                  <Sparkles className="w-3 h-3" />
                  Featured
                </span>
                <span className="px-2.5 py-1 bg-white text-gray-900 rounded text-[9px] font-bold uppercase tracking-wider shadow border border-gray-100">
                  {blogPosts[0].category}
                </span>
              </div>
            </div>

            {/* Content Column */}
            <div className="p-6 sm:p-8 lg:p-10 lg:col-span-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {blogPosts[0].readTime}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 text-indigo-600 font-bold uppercase">
                    <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
                    Trending
                  </span>
                </div>

                <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors">
                  {blogPosts[0].title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6">
                  {blogPosts[0].excerpt}
                </p>
              </div>

              <div>
                {/* Author Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                    {blogPosts[0].author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>{blogPosts[0].author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{formatDate(blogPosts[0].publishDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-grow flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all rounded">
                    <span>Read Full Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 rounded transition-colors" title="Bookmark">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 rounded transition-colors" title="Share">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="h-1 w-8 bg-indigo-600 rounded"></span>
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            {selectedCategory === 'All' && !searchQuery ? 'Latest Articles' :
              searchQuery ? 'Search Results' :
                `${selectedCategory} Articles`}
          </h2>
          <span className="text-[9px] text-gray-500 font-mono bg-white shadow-sm border border-gray-100 py-0.5 px-2 rounded-full font-bold uppercase tracking-wider">
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.slice(selectedCategory === 'All' && !searchQuery ? 1 : 0).map((post) => (
              <article
                key={post._id}
                className="group bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border border-gray-100 flex flex-col justify-between overflow-hidden"
              >
                {/* Image & Badges */}
                <div className="relative h-48 overflow-hidden bg-gray-50">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>

                  {/* Floating Category Badge */}
                  <span className="absolute top-4 right-4 px-2 py-0.5 bg-white text-gray-900 text-[8px] font-extrabold uppercase rounded shadow tracking-wider border border-gray-100">
                    {post.category}
                  </span>
                </div>

                {/* Content Area */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    {/* Read Time & Details */}
                    <div className="flex items-center gap-3 text-[9px] text-gray-500 mb-3 flex-wrap font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {post.readTime}
                      </span>
                      <span>•</span>
                      <span className="text-gray-500">{post.category}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div>
                    {/* Author & Publish Date */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-full flex items-center justify-center text-indigo-600 font-extrabold text-[10px] shadow-sm">
                          {post.author.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-900 flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            {post.author}
                          </span>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(post.publishDate)}
                          </span>
                        </div>
                      </div>

                      <button className="bg-gray-900 hover:bg-gray-800 text-white p-2 hover:scale-105 rounded transition-all" title="Read Article">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] max-w-xl mx-auto p-8 rounded-xl">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-sm font-bold text-gray-900 mb-1">No articles found</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              We couldn't find any articles matching your search criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded shadow"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative bg-gradient-to-br from-[#621180] via-[#220d57] to-[#9c125a] rounded-3xl overflow-hidden shadow-2xl p-10 sm:p-16 text-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-[10px] font-bold uppercase tracking-wider mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Stay Informed</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-white tracking-tight">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl mx-auto leading-relaxed mb-8">
              Get the latest <strong className="text-white">cutting-edge insights</strong>, industry trends, and technology updates delivered directly to your inbox every week
            </p>

            <div className="max-w-xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full sm:flex-grow px-5 py-3 rounded-xl text-gray-900 placeholder-gray-400 text-xs font-semibold focus:outline-none shadow"
                />
                <button className="bg-white text-[#4c1d95] hover:bg-gray-50 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shadow hover:shadow-lg">
                  Subscribe Now
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-indigo-100 font-semibold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Weekly Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Exclusive Content</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>10,000+ Subscribers</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Calendar, User, Tag, ArrowRight } from 'lucide-react';
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

const mockPosts = [
  {
    id: 1,
    title: '5G Revolution in Indian Railways: A Game Changer',
    excerpt: 'Exploring how 5G technology is transforming railway operations, passenger experience, and safety protocols across Indian railway networks.',
    author: 'Dr. Vikram Singh',
    date: 'December 1, 2024',
    category: 'Railway',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
    readTime: '5 min read'
  },
  {
    id: 2,
    title: 'Cybersecurity in Defense Communications',
    excerpt: 'Understanding the critical importance of encrypted communication systems in modern defense operations and how Telogica is leading the charge.',
    author: 'Col. Rajesh Kumar (Retd.)',
    date: 'November 28, 2024',
    category: 'Defence',
    image: 'https://images.unsplash.com/photo-1580584126903-c17d41830450?w=800',
    readTime: '7 min read'
  },
  {
    id: 3,
    title: 'The Future of Smart Cities: Telecom Infrastructure',
    excerpt: 'How advanced telecom infrastructure is becoming the backbone of smart city initiatives across India, enabling IoT and connected services.',
    author: 'Priya Sharma',
    date: 'November 25, 2024',
    category: 'Telecom',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',
    readTime: '6 min read'
  },
  {
    id: 4,
    title: 'AI-Powered Predictive Maintenance in Railways',
    excerpt: 'Leveraging artificial intelligence and machine learning to predict equipment failures and optimize maintenance schedules in railway operations.',
    author: 'Arjun Patel',
    date: 'November 20, 2024',
    category: 'Railway',
    image: 'https://images.unsplash.com/photo-1527684651001-731c474bbb5a?w=800',
    readTime: '8 min read'
  },
  {
    id: 5,
    title: 'Edge Computing in Tactical Defense Systems',
    excerpt: 'Exploring the role of edge computing in enabling real-time decision making for tactical defense applications in challenging environments.',
    author: 'Maj. Ananya Reddy',
    date: 'November 15, 2024',
    category: 'Defence',
    image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800',
    readTime: '6 min read'
  },
  {
    id: 6,
    title: 'Building Resilient Telecom Networks',
    excerpt: 'Best practices and technologies for creating robust, disaster-resistant telecom infrastructure that ensures uninterrupted connectivity.',
    author: 'Suresh Menon',
    date: 'November 10, 2024',
    category: 'Telecom',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    readTime: '5 min read'
  }
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Telogica Blog</h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
              Insights, innovations, and industry trends from our experts
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Post */}
      {selectedCategory === 'All' && blogPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <img 
                src={blogPosts[0].image} 
                alt={blogPosts[0].title}
                className="w-full h-full object-cover"
              />
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {blogPosts[0].category}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{blogPosts[0].title}</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">{blogPosts[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{blogPosts[0].author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{formatDate(blogPosts[0].publishDate || blogPosts[0].date)}</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-800 transition-colors">
                  Read More <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          {selectedCategory === 'All' ? 'Latest Articles' : `${selectedCategory} Articles`}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.slice(selectedCategory === 'All' ? 1 : 0).map(post => (
            <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">{post.category}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{post.readTime}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-purple-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-700 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>{formatDate(post.publishDate || post.date)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Get the latest insights, industry trends, and technology updates delivered directly to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

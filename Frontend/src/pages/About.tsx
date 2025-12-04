import React, { useEffect, useState } from 'react';
import { Building2, Users, Award, Globe, Target, Zap } from 'lucide-react';
import api from '../api';

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  image: string;
  bio?: string;
}

interface Content {
  _id: string;
  section: string;
  title?: string;
  subtitle?: string;
  description?: string;
  content?: any;
  image?: string;
}

export default function About() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [content, setContent] = useState<Record<string, Content>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamRes, contentRes] = await Promise.all([
        api.get('/api/team?department=Leadership'),
        api.get('/api/content')
      ]);
      
      setTeamMembers(teamRes.data);
      
      const contentMap: Record<string, Content> = {};
      contentRes.data.forEach((item: Content) => {
        contentMap[item.section] = item;
      });
      setContent(contentMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const heroContent = content['about_hero'] || { title: 'About Telogica', subtitle: 'Leading provider of cutting-edge solutions' };
  const storyContent = content['about_story'] || {};
  const missionContent = content['about_mission'] || {};
  const visionContent = content['about_vision'] || {};

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{heroContent.title}</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              {heroContent.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {storyContent.title || 'Our Story'}
            </h2>
            <div className="text-gray-700 leading-relaxed" 
                 dangerouslySetInnerHTML={{ __html: storyContent.description || 
                   'Founded in 2010, Telogica has been at the forefront of technological innovation...' 
                 }} 
            />
          </div>
          <div className="relative">
            <img 
              src={storyContent.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"} 
              alt="Modern office building"
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 p-8 rounded-lg">
              <Target className="text-blue-600 mb-4" size={48} />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {missionContent.title || 'Our Mission'}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {missionContent.description || 'To deliver innovative, reliable, and secure technology solutions...'}
              </p>
            </div>
            <div className="bg-green-50 p-8 rounded-lg">
              <Zap className="text-green-600 mb-4" size={48} />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {visionContent.title || 'Our Vision'}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {visionContent.description || 'To be the global leader in mission-critical technology solutions...'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="text-blue-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
            <p className="text-gray-700">
              We strive for excellence in every product and service we deliver, maintaining 
              the highest standards of quality and performance.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Collaboration</h3>
            <p className="text-gray-700">
              We believe in the power of teamwork and partnerships, working closely with our 
              clients to understand and exceed their expectations.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="text-purple-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
            <p className="text-gray-700">
              Continuous innovation drives our success, enabling us to stay ahead of technological 
              advancements and deliver cutting-edge solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
              <div className="text-blue-200">Years of Excellence</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Products Delivered</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-blue-200">Countries Served</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-200">Client Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Leadership</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.length > 0 ? (
            teamMembers.map((leader) => (
              <div key={leader._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img src={leader.image} alt={leader.name} className="w-full h-64 object-cover" />
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{leader.name}</h3>
                  <p className="text-gray-600">{leader.role}</p>
                </div>
              </div>
            ))
          ) : (
            [
              { name: 'Rajesh Kumar', role: 'CEO & Founder', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400' },
              { name: 'Priya Sharma', role: 'CTO', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400' },
              { name: 'Arjun Patel', role: 'VP of Operations', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400' },
            ].map((leader, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img src={leader.image} alt={leader.name} className="w-full h-64 object-cover" />
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{leader.name}</h3>
                  <p className="text-gray-600">{leader.role}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

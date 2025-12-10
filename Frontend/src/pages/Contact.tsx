import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Clock, Globe, Building2, Users, Headphones, MessageSquare, CheckCircle, ArrowRight, Linkedin, Facebook, Youtube } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../api';

export default function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/contact', formData);
      toast.success('Thank you for contacting us! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-20 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800 text-white py-24 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MessageSquare className="w-4 h-4" />
              <span>We're Here to Help</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Get in Touch
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Have a question or need assistance? Our team is ready to provide expert support for all your technology needs.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Quick Response</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Expert Team</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>24/7 Support Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Sales Inquiry */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-600">
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Headphones className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sales Inquiry</h3>
            <p className="text-gray-600 mb-4 text-sm">Explore our products and solutions</p>
            <a href="mailto:sales@telogica.com" className="text-blue-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all">
              sales@telogica.com
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Technical Support */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-green-600">
            <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Technical Support</h3>
            <p className="text-gray-600 mb-4 text-sm">Get help with our products</p>
            <a href="mailto:support@telogica.com" className="text-green-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all">
              support@telogica.com
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Office Location */}
          <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border-t-4 border-purple-600">
            <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Our Office</h3>
            <p className="text-gray-600 mb-4 text-sm">Jubilee Hills, Hyderabad</p>
            <a href="tel:+919396610682" className="text-purple-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all">
              +91 9396610682
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                  <p className="text-sm text-gray-600">We'll respond within 24 hours</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="careers">Careers</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  By submitting this form, you agree to our{' '}
                  <a href="/privacy-policy" className="text-indigo-600 hover:underline">Privacy Policy</a>
                </p>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Head Office */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-xl p-6 border border-indigo-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Head Office</h3>
              </div>
              <div className="flex items-start gap-3 text-gray-700 bg-white p-4 rounded-xl">
                <MapPin size={20} className="text-indigo-600 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-gray-900 mb-1">TELOGICA LIMITED</p>
                  <p className="text-gray-600">
                    Empire Square, Plot No 233-A, 234 &amp; 235,<br />
                    3rd Floor, Road No 36, Jubilee Hills,<br />
                    Hyderabad - 500 033, Telangana, India
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Details</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Phone size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium mb-1">Call Us</p>
                      <a href="tel:+919396610682" className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block">
                        +91 9396610682
                      </a>
                      <a href="tel:+914027531324" className="text-sm text-gray-700 hover:text-blue-600 transition-colors block">
                        +91-40-27531324 to 26
                      </a>
                      <a href="tel:+914027535423" className="text-sm text-gray-700 hover:text-blue-600 transition-colors block">
                        +91-40-27535423
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <Mail size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium mb-1">Email Us</p>
                      <a href="mailto:sales@telogica.com" className="font-semibold text-gray-900 hover:text-green-600 transition-colors block">
                        sales@telogica.com
                      </a>
                      <a href="mailto:support@telogica.com" className="text-sm text-gray-700 hover:text-green-600 transition-colors block">
                        support@telogica.com
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg">
                      <Globe size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium mb-1">Visit Website</p>
                      <a href="https://www.telogica.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                        www.telogica.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl p-6 border border-amber-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Business Hours</h3>
              </div>
              <div className="space-y-3 bg-white p-4 rounded-xl">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900 text-sm">Monday - Friday</span>
                  </div>
                  <span className="text-gray-600 text-sm">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900 text-sm">Saturday</span>
                  </div>
                  <span className="text-gray-600 text-sm">9:00 AM - 2:00 PM</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900 text-sm">Sunday</span>
                  </div>
                  <span className="text-red-600 text-sm font-medium">Closed</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center">All times are in Indian Standard Time (IST)</p>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/aishwaryatechtele" target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl flex items-center justify-center transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="https://www.youtube.com/user/aishwaryatechtele" target="_blank" rel="noopener noreferrer" className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl flex items-center justify-center transition-colors">
                  <Youtube size={20} />
                </a>
                <a href="https://www.linkedin.com/company/telogica-limited/" target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-xl flex items-center justify-center transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Visit Our Office</h2>
            <p className="text-gray-600">Find us at our head office in Jubilee Hills, Hyderabad</p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 relative">
              {/* Google Maps Embed */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.5989374447746!2d78.41087631487654!3d17.433068688037586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9149e9c8b3a5%3A0x1c5f8e5e5e5e5e5e!2sJubilee%20Hills%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Telogica Office Location"
              />
              {/* Overlay with address */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <MapPin size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">TELOGICA LIMITED</p>
                    <p className="text-sm text-gray-600">
                      Empire Square, 3rd Floor, Rd No 36, Jubilee Hills, Hyderabad - 500 033
                    </p>
                  </div>
                  <a
                    href="https://maps.google.com/?q=Jubilee+Hills+Hyderabad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Why Choose Telogica?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're committed to providing exceptional service and cutting-edge technology solutions
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Trusted Partner</h3>
              <p className="text-sm text-gray-600">Serving defense, telecom & industrial sectors</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Expert Team</h3>
              <p className="text-sm text-gray-600">Experienced professionals ready to help</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">Round-the-clock assistance available</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow border border-gray-100">
              <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-sm text-gray-600">We respond within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

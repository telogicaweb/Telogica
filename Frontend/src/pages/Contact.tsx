import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock, Globe, Building2, Users, Headphones, MessageSquare, CheckCircle, ArrowRight, Linkedin, Facebook, Youtube, ChevronRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Top bar — breadcrumb strip */}
      <div className="bg-gray-900 pt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">Contact Us</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 rounded">
              <MessageSquare className="w-3 h-3" />
              <span>We're Here to Help</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mt-4">
              Get in Touch
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
              Have a question or need assistance? Our team is ready to provide expert support for all your technology needs.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs font-semibold text-gray-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Quick Response</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Expert Team</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>24/7 Support Available</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Sales Inquiry */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-blue-600 bg-gradient-to-b from-blue-50/10 to-white justify-between h-full"
          >
            <div>
              <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Headphones className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Sales Inquiry</h3>
              <p className="text-[11px] text-gray-500 mt-1">Explore our products and solutions</p>
            </div>
            <a href="mailto:sales@telogica.com" className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              sales@telogica.com
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* Technical Support */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-green-600 bg-gradient-to-b from-green-50/10 to-white justify-between h-full"
          >
            <div>
              <div className="bg-green-100 text-green-600 w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Technical Support</h3>
              <p className="text-[11px] text-gray-500 mt-1">Get help with our products</p>
            </div>
            <a href="mailto:support@telogica.com" className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors">
              support@telogica.com
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* Office Location */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-purple-600 bg-gradient-to-b from-purple-50/10 to-white justify-between h-full"
          >
            <div>
              <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Visit Our Office</h3>
              <p className="text-[11px] text-gray-500 mt-1">Jubilee Hills, Hyderabad</p>
            </div>
            <a href="tel:+919396610682" className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
              +91 9396610682
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* Business Hours */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-amber-500 bg-gradient-to-b from-amber-50/10 to-white justify-between h-full"
          >
            <div>
              <div className="bg-amber-100 text-amber-600 w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Business Hours</h3>
              <div className="text-[10px] text-gray-500 mt-1.5 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-600">Mon - Sat:</span>
                  <span className="text-gray-900 font-medium">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center pt-0.5 border-t border-amber-100/30">
                  <span className="font-semibold text-gray-600">Sunday:</span>
                  <span className="text-red-500 font-bold">Closed</span>
                </div>
              </div>
            </div>
            <span className="mt-4 pt-3 border-t border-gray-100 text-[9px] text-amber-800 font-semibold text-center uppercase tracking-wider block">
              All times are in Indian Standard Time (IST)
            </span>
          </motion.div>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gray-100 text-gray-700 w-10 h-10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Send us a Message</h2>
                    <p className="text-xs text-gray-400">We'll respond within 24 hours</p>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all duration-200"
                        placeholder="John Doe"
                      />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all duration-200"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all duration-200"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all duration-200"
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
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:bg-white transition-all duration-200 resize-none"
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-5 pt-3 border-t border-gray-100">
              By submitting this form, you agree to our{' '}
              <a href="/privacy-policy" className="text-gray-900 underline hover:text-indigo-600">Privacy Policy</a>
            </p>
          </div>
        </div>

          {/* Right Column Consolidated Info Panels */}
          <div className="space-y-6 flex flex-col h-full">
            {/* Office Locations, Fast Communication & Socials */}
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-700" />
                  Office & Contact Info
                </h3>
                
                {/* Head Office Address Box with subtle indigo-blue gradient background */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
                  <MapPin className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600">
                    <p className="font-bold text-indigo-950">TELOGICA LIMITED (HEAD OFFICE)</p>
                    <p className="leading-relaxed mt-1">
                      Empire Square, Plot No 233-A, 234 &amp; 235,<br />
                      3rd Floor, Road No 36, Jubilee Hills,<br />
                      Hyderabad - 500 033, Telangana, India
                    </p>
                  </div>
                </div>

                {/* Call row with blue-indigo gradient background */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl hover:shadow-sm transition-all flex gap-3 items-start">
                  <Phone className="w-4.5 h-4.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-grow space-y-0.5">
                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Call Us</p>
                    <a href="tel:+919396610682" className="font-bold text-gray-900 text-xs hover:text-blue-600 transition-colors block">
                      +91 9396610682
                    </a>
                    <a href="tel:+914027531324" className="text-xs text-gray-600 hover:text-blue-600 transition-colors block">
                      +91-40-27531324 to 26
                    </a>
                    <a href="tel:+914027535423" className="text-xs text-gray-600 hover:text-blue-600 transition-colors block">
                      +91-40-27535423
                    </a>
                  </div>
                </div>

                {/* Email row with green-emerald gradient background */}
                <div className="p-3.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl hover:shadow-sm transition-all flex gap-3 items-start">
                  <Mail className="w-4.5 h-4.5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-grow space-y-0.5">
                    <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Email Us</p>
                    <a href="mailto:sales@telogica.com" className="font-bold text-gray-900 text-xs hover:text-green-600 transition-colors block">
                      sales@telogica.com
                    </a>
                    <a href="mailto:support@telogica.com" className="text-xs text-gray-600 hover:text-green-600 transition-colors block">
                      support@telogica.com
                    </a>
                  </div>
                </div>

                {/* Website row with purple-pink gradient background */}
                <div className="p-3.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl hover:shadow-sm transition-all flex gap-3 items-start">
                  <Globe className="w-4.5 h-4.5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-grow space-y-0.5">
                    <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Website</p>
                    <a href="https://www.telogica.com" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 text-xs hover:text-purple-600 transition-colors">
                      www.telogica.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Connectivity */}
              <div className="pt-4 border-t border-gray-100 mt-auto">
                <h4 className="text-xs font-bold text-gray-900 mb-2.5">Follow Us</h4>
                <div className="flex gap-2">
                  <a
                    href="https://www.facebook.com/aishwaryatechtele"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 border border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all rounded flex items-center justify-center gap-1 text-xs font-semibold text-gray-600"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                    <span>Facebook</span>
                  </a>
                  <a
                    href="https://www.youtube.com/user/aishwaryatechtele"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 border border-gray-200 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all rounded flex items-center justify-center gap-1 text-xs font-semibold text-gray-600"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>YouTube</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/telogica-limited/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 border border-gray-200 hover:border-blue-700 hover:bg-blue-50 hover:text-blue-700 transition-all rounded flex items-center justify-center gap-1 text-xs font-semibold text-gray-600"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Visit Our Office</h2>
            <p className="text-xs text-gray-500 mt-1">Find us at our head office in Jubilee Hills, Hyderabad</p>
          </div>
          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden relative group">
            <div className="h-96 relative">
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
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded border border-gray-100 p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-gray-100 text-gray-700 p-2 rounded flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-xs">TELOGICA LIMITED</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      Empire Square, 3rd Floor, Rd No 36, Jubilee Hills, Hyderabad - 500 033
                    </p>
                  </div>
                </div>
                <a
                  href="https://maps.google.com/?q=Jubilee+Hills+Hyderabad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-900 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap w-full sm:w-auto text-center"
                >
                  Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Why Choose Telogica?</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl mx-auto">
              We're committed to providing exceptional service and cutting-edge technology solutions
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-5 text-center flex flex-col items-center group">
              <div className="bg-gray-50 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <CheckCircle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Trusted Partner</h3>
              <p className="text-[11px] text-gray-500 mt-1">Serving defense, telecom & industrial sectors</p>
            </div>
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-5 text-center flex flex-col items-center group">
              <div className="bg-gray-50 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Expert Team</h3>
              <p className="text-[11px] text-gray-500 mt-1">Experienced professionals ready to help</p>
            </div>
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-5 text-center flex flex-col items-center group">
              <div className="bg-gray-50 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">24/7 Support</h3>
              <p className="text-[11px] text-gray-500 mt-1">Round-the-clock assistance available</p>
            </div>
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-5 text-center flex flex-col items-center group">
              <div className="bg-gray-50 text-gray-700 w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Quick Response</h3>
              <p className="text-[11px] text-gray-500 mt-1">We respond within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

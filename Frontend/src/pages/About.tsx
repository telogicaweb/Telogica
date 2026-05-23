import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Target, Zap, Building2, Users, TrendingUp, Globe, Factory, Shield, Sparkles, CheckCircle, MapPin, Mail, Phone, ChevronRight, ArrowRight } from 'lucide-react';

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Combined Header (Breadcrumbs + Hero Banner) */}
      <section className="bg-slate-900 text-white pt-24 pb-6 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col">
          {/* Integrated Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] mb-2">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">About Us</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            About Telogica Limited
          </h1>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Company Overview / Our Story */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-6">
          {/* Left Column Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-7 flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 rounded mb-4 w-fit">
              <Building2 className="w-3 h-3" />
              <span>Our Story</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              Leading the Way in Defence & Telecom Solutions
            </h2>
            <div className="space-y-4 text-xs sm:text-sm text-gray-500 leading-relaxed">
              <p>
                <strong className="text-gray-900 font-bold">Telogica Limited</strong> (Formerly Aishwarya Technologies and Telecom Ltd) is an <strong className="text-indigo-600 font-bold">ISO 9001:2015 Certified</strong> company that has established itself as a trusted name in the Indian Defence and Telecom industries.
              </p>
              <p>
                As a <strong className="text-gray-900 font-bold">design and manufacturing company</strong>, we produce a comprehensive range of test and measuring equipment including Fiber, Data, and Copper Cable Fault Locators that meet international standards.
              </p>
              <p>
                We trade in advanced equipment such as <strong className="text-gray-800 font-semibold">Spectrum Analyzers, Vector Network Analyzers, Signal Generators, Site Analyzers, BTS Testers, SDH Analyzers, Splicing Machines, OTDRs, Cable Fault Locators, Cable Route Locators, and Electronic Markers and Locating Systems</strong>.
              </p>
              <p className="text-indigo-600 font-bold pt-2 border-t border-indigo-50 flex items-start gap-1.5 text-xs sm:text-sm">
                <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <span>Apart from being a prominent player in the domestic telecom industry, we are a trendsetter in the Indian Telecom Industry in qualitative terms.</span>
              </p>
            </div>
          </motion.div>

          {/* Right Column Image & Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-5 relative"
          >
            <div className="bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 p-4">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80" 
                alt="Telecom Equipment"
                className="w-full h-80 object-cover rounded mb-4 shadow-inner"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-100/50 p-4 rounded text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">75+</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">Team Members</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50/60 to-white border border-blue-100/50 p-4 rounded text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">9+</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-1">R&D Personnel</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Resources Grid Section */}
        <section className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Our Resources</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl mx-auto">
              Combining expertise from reputed Indian Universities with industry experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* R&D Personnel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-blue-600 bg-gradient-to-b from-blue-50/10 to-white"
            >
              <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">9</div>
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mt-1">R&D Personnel</div>
              <p className="text-[11px] text-gray-400 mt-1 flex-grow">Continuous Innovation & Development</p>
            </motion.div>
            
            {/* Customer Support */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-emerald-600 bg-gradient-to-b from-emerald-50/10 to-white"
            >
              <div className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">4</div>
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mt-1">Customer Support</div>
              <p className="text-[11px] text-gray-400 mt-1 flex-grow">Technical Operations & Client Support</p>
            </motion.div>
            
            {/* Marketing Team */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-purple-600 bg-gradient-to-b from-purple-50/10 to-white"
            >
              <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">20</div>
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mt-1">Marketing Team</div>
              <p className="text-[11px] text-gray-400 mt-1 flex-grow">Strategic Growth & Business Expansion</p>
            </motion.div>
            
            {/* Production Staff */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col border-t-4 border-t-amber-600 bg-gradient-to-b from-amber-50/10 to-white"
            >
              <div className="bg-amber-100 text-amber-600 w-8 h-8 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <Factory className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">45</div>
              <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mt-1">Production Staff</div>
              <p className="text-[11px] text-gray-400 mt-1 flex-grow">Precision Sourcing & Quality Manufacturing</p>
            </motion.div>
          </div>
        </section>

        {/* Areas of Service & Global Reach */}
        <section className="mt-16">
          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 p-6 sm:p-8 flex flex-col">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Areas of Service
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Our team of <strong className="text-gray-900 font-bold">75 personnel</strong> is dedicated to providing excellent customer support, producing high-quality materials, and handling administrative tasks. Our staff members have impressive academic backgrounds and come from reputable Indian organizations including:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                'Sanchar Nigam Limited',
                'Bharti Airtel',
                'Tata Tele Services',
                'Reliance Communications',
                'MTNL',
                'Indian Railways',
                'Defence Sectors'
              ].map((org, index) => (
                <div key={index} className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 hover:border-indigo-200 px-4 py-3 rounded transition-all duration-200">
                  <CheckCircle className="text-indigo-600 flex-shrink-0 w-4 h-4" />
                  <span className="text-xs text-gray-700 font-bold">{org}</span>
                </div>
              ))}
            </div>

            {/* Global Reach card */}
            <div className="mt-8 bg-gradient-to-r from-gray-900 to-indigo-950 rounded p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-950/40 shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-900/50 p-2 rounded">
                  <Globe className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Global Reach & Connectivity</h4>
                  <p className="text-xs text-indigo-200/90 mt-0.5">Serving leading industrial grids globally</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 md:max-w-md leading-relaxed">
                We are proud to export our products and services worldwide, serving clients across multiple continents with strict adherence to qualitative benchmarks.
              </p>
            </div>
          </div>
        </section>

        {/* Our Business Segments */}
        <section className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Our Business Segments</h2>
            <p className="text-xs text-gray-500 mt-1">Serving diverse sectors with specialized technology solutions</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Telecom Segment */}
            <div className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-6 flex flex-col border-t-4 border-t-blue-600 bg-gradient-to-b from-blue-50/10 to-white justify-between">
              <div>
                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Telecommunication</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  We provide nation-wide services to corporations in business, industry & government with cutting-edge telecom testing tools.
                </p>
              </div>
              <ul className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Test & Measuring Equipment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Network Analyzers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Cable Fault Locators</span>
                </li>
              </ul>
            </div>
            
            {/* Defence Segment */}
            <div className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-6 flex flex-col border-t-4 border-t-emerald-600 bg-gradient-to-b from-emerald-50/10 to-white justify-between">
              <div>
                <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Defence Applications</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  A pioneer in Electronics & Communication Technology with a proven domestic track record in critical military and security systems.
                </p>
              </div>
              <ul className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Military-grade Sourcing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Secure Communication Hardware</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Advanced Signal Analyzers</span>
                </li>
              </ul>
            </div>
            
            {/* Manufacturing Segment */}
            <div className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-6 flex flex-col border-t-4 border-t-purple-600 bg-gradient-to-b from-purple-50/10 to-white justify-between">
              <div>
                <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Factory className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Advanced Manufacturing</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  A state-of-the-art manufacturing facility specializing in producing robust diagnostic equipment meeting tight international benchmarks.
                </p>
              </div>
              <ul className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>ISO 9001:2015 Quality Assurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Custom Engineering & Splicing Tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5 w-3.5 h-3.5" />
                  <span>Strict Testing & Calibration</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Future Vision Section (Glassmorphism vision cards) */}
        <section className="mt-16">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl py-12 px-6 sm:px-12 relative overflow-hidden shadow-2xl">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMDktMS43OTEgNC00IDRDMC43OTEgMjAgMCAxOC4yMDkgMCAxNnMuNzkxLTQgNC00IDQgMS43OTEgNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 pointer-events-none"></div>
            
            <div className="relative z-10 text-center mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 rounded-full border border-white/5 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Strategic Vision</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-4">Our Future Plans</h2>
              <p className="text-xs text-indigo-200/90 mt-1 max-w-xl mx-auto font-light leading-relaxed">
                Telogica Ltd is keen to expand its boundaries and establish solid distribution channels across other countries.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Card 1 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <Globe className="w-8 h-8 mb-4 text-blue-300" />
                <h3 className="text-base font-bold mb-2">Global Expansion</h3>
                <p className="text-xs text-indigo-100/80 leading-relaxed font-light">
                  Expanding our footprints to export critical measuring products and secure valuable international distribution partnerships.
                </p>
              </div>
              
              {/* Card 2 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <Zap className="w-8 h-8 mb-4 text-yellow-300" />
                <h3 className="text-base font-bold mb-2">Innovation Hub</h3>
                <p className="text-xs text-indigo-100/80 leading-relaxed font-light">
                  Directing focused research and development to build advanced, modular vector analyzers and splicing hardware.
                </p>
              </div>
              
              {/* Card 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <Award className="w-8 h-8 mb-4 text-green-300" />
                <h3 className="text-base font-bold mb-2">Qualitative Leadership</h3>
                <p className="text-xs text-indigo-100/80 leading-relaxed font-light">
                  Maintained strict ISO compliance to consolidate our reputation as a qualitative trendsetter in the industrial measuring sector.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Get in Touch Split-Card */}
        <section className="mt-16">
          <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            
            {/* Info Column */}
            <div className="p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Get in Touch</h2>
                <p className="text-xs text-gray-500 leading-relaxed mb-8">
                  Ready to explore how Telogica Limited can support your defense or telecom business needs? Our team is standing by to help.
                </p>
                
                <div className="space-y-4">
                  {/* Address row with subtle indigo-blue gradient background */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl flex gap-3 items-start">
                    <MapPin className="text-indigo-600 mt-0.5 w-5 h-5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-indigo-950 text-xs mb-0.5">Head Office</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Empire Square, Plot No 233-A, 234 &amp; 235,<br />
                        3rd Floor, Road No 36, Jubilee Hills,<br />
                        Hyderabad - 500 033, Telangana, India
                      </p>
                    </div>
                  </div>
                  
                  {/* Phone row with blue-indigo gradient background */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                    <Phone className="text-blue-600 mt-0.5 w-5 h-5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-blue-900 text-xs mb-0.5">Telephone Networks</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        +91 9396610682<br />
                        +91-40-27531324 to 26
                      </p>
                    </div>
                  </div>
                  
                  {/* Email row with green-emerald gradient background */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl flex gap-3 items-start">
                    <Mail className="text-green-600 mt-0.5 w-5 h-5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-green-900 text-xs mb-0.5">Email Directory</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        sales@telogica.com | support@telogica.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link
                to="/contact"
                className="mt-8 flex items-center justify-center gap-1.5 bg-gray-900 text-white py-3 px-6 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors w-fit rounded"
              >
                <span>Navigate to Contact Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            {/* Visual Column */}
            <div className="relative min-h-[350px] lg:min-h-full">
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                alt="Office"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-indigo-900/40 to-transparent flex items-end p-8 sm:p-12">
                <div className="text-white">
                  <h3 className="text-lg font-bold mb-1">Hyderabad Facility</h3>
                  <p className="text-xs text-indigo-200/90 leading-relaxed font-light">Experience domestic innovation and rigorous engineering firsthand at our main facility.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quality Certification badge */}
        <section className="mt-16">
          <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left shadow-sm">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full flex-shrink-0 animate-pulse">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">ISO 9001:2015 Quality Validation</h3>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
                Our strict commitment to quality management is validated by standard international certifiers, ensuring our equipment achieves high domestic & export benchmarks.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Award, Target, Zap, Building2, Users, TrendingUp, Globe, Factory, Shield, Sparkles, CheckCircle, MapPin, Mail, Phone } from 'lucide-react';

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 text-white pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMDktMS43OTEgNC00IDRDMC43OTEgMjAgMCAxOC4yMDkgMCAxNnMuNzkxLTQgNC00IDQgMS43OTEgNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>ISO 9001:2015 Certified Company</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Telogica Limited</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Synonymous with Indian Defence and Telecom sector - A pioneer in designing and manufacturing test and measuring equipment
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Company Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-full text-sm font-semibold text-indigo-700">
              <Building2 className="w-4 h-4" />
              Our Story
            </div>
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Leading the Way in Defence & Telecom Solutions
            </h2>
            <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
              <p>
                <strong className="text-gray-900">Telogica Limited</strong> (Formerly Aishwarya Technologies and Telecom Ltd) is an <strong className="text-indigo-600">ISO 9001:2015 Certified</strong> company that has established itself as a trusted name in the Indian Defence and Telecom industries.
              </p>
              <p>
                As a <strong className="text-gray-900">design and manufacturing company</strong>, we produce a comprehensive range of test and measuring equipment including Fiber, Data, and Copper Cable Fault Locators that meet international standards.
              </p>
              <p>
                We trade in advanced equipment such as <strong className="text-gray-900">Spectrum Analyzers, Vector Network Analyzers, Signal Generators, Site Analyzers, BTS Testers, SDH Analyzers, Splicing Machines, OTDRs, Cable Fault Locators, Cable Route Locators, and Electronic Markers and Locating Systems</strong>.
              </p>
              <p className="text-indigo-600 font-semibold">
                Apart from being a prominent player in the domestic telecom industry, we are a trendsetter in the Indian Telecom Industry in qualitative terms.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl transform rotate-3"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform -rotate-1">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80" 
                alt="Telecom Equipment"
                className="rounded-xl w-full h-96 object-cover mb-6"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-indigo-600">75+</div>
                  <div className="text-sm text-gray-600 mt-1">Team Members</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">9</div>
                  <div className="text-sm text-gray-600 mt-1">R&D Personnel</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Resources & Team */}
      <section className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Resources</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combining expertise from reputed Indian Universities with industry experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">9</div>
              <div className="text-gray-600 font-medium">R&D Personnel</div>
              <p className="text-sm text-gray-500 mt-2">Innovation & Development</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">4</div>
              <div className="text-gray-600 font-medium">Customer Support</div>
              <p className="text-sm text-gray-500 mt-2">24/7 Technical Support</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">20</div>
              <div className="text-gray-600 font-medium">Marketing Team</div>
              <p className="text-sm text-gray-500 mt-2">Strategic Growth</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Factory className="text-white" size={32} />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">45</div>
              <div className="text-gray-600 font-medium">Production Staff</div>
              <p className="text-sm text-gray-500 mt-2">Quality Manufacturing</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Building2 className="text-indigo-600" size={28} />
              Areas of Service
            </h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              Our team of <strong className="text-indigo-600">75 personnel</strong> is dedicated to providing excellent customer support, producing high-quality materials, and handling administrative tasks. Our staff members have impressive academic backgrounds and come from reputable Indian organizations including:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Sanchar Nigam Limited',
                'Bharti Airtel',
                'Tata Tele Services',
                'Reliance Communications',
                'MTNL',
                'Indian Railways',
                'Defence Sectors'
              ].map((org, index) => (
                <div key={index} className="flex items-center gap-3 bg-indigo-50 px-4 py-3 rounded-lg">
                  <CheckCircle className="text-indigo-600 flex-shrink-0" size={20} />
                  <span className="text-gray-800 font-medium">{org}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="flex-shrink-0" size={24} />
                <h4 className="text-xl font-bold">Global Reach</h4>
              </div>
              <p className="text-blue-100">
                We are proud to export our products and services worldwide, serving clients across multiple continents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Segments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Business Segments</h2>
          <p className="text-xl text-gray-600">Serving diverse sectors with specialized solutions</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-indigo-500">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Telecommunication</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We provide services nation-wide to organizations in business, industry & government with cutting-edge telecom solutions.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Test & Measuring Equipment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Network Analyzers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Cable Fault Locators</span>
              </li>
            </ul>
          </div>
          
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-green-500">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Defence</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              A pioneer in Electronics & Communication Technology with proven track record in defence applications.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Military-grade Equipment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Secure Communications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Advanced Testing Systems</span>
              </li>
            </ul>
          </div>
          
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 border-2 border-transparent hover:border-purple-500">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Factory className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Manufacturing</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              ISO 9001:2015 certified manufacturing facility producing equipment that meets international standards.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Quality Assurance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>Custom Solutions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <span>International Standards</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Future Plans */}
      <section className="bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMDktMS43OTEgNC00IDRDMC43OTEgMjAgMCAxOC4yMDkgMCAxNnMuNzkxLTQgNC00IDQgMS43OTEgNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Future Vision</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Our Future Plans</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Telogica Ltd is keen to have distributors/traders export our products to other countries
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
              <Globe className="w-12 h-12 mb-4 text-blue-300" />
              <h3 className="text-2xl font-bold mb-3">Global Expansion</h3>
              <p className="text-blue-100">
                Expanding our reach to serve more countries and establishing international partnerships
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
              <Zap className="w-12 h-12 mb-4 text-yellow-300" />
              <h3 className="text-2xl font-bold mb-3">Innovation Hub</h3>
              <p className="text-blue-100">
                Continuous R&D to develop next-generation testing and measuring equipment
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
              <Award className="w-12 h-12 mb-4 text-green-300" />
              <h3 className="text-2xl font-bold mb-3">Quality Leadership</h3>
              <p className="text-blue-100">
                Maintaining our position as a trendsetter in quality and reliability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-12 lg:p-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-gray-600 text-lg mb-8">
                Ready to explore how Telogica Limited can support your business needs? Our team is here to help.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-600 p-3 rounded-xl">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                    <p className="text-gray-600">
                      Empire Square, Plot No 233-A, 234 & 235,<br />
                      3rd Floor, Road No 36, Jubilee Hills,<br />
                      Hyderabad - 500 033, Telangana, India
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                    <p className="text-gray-600">
                      +91 9396610682<br />
                      +91-40-27531324 to 26
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-green-600 p-3 rounded-xl">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-600">
                      sales@telogica.com<br />
                      support@telogica.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative h-full min-h-[400px]">
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                alt="Office"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent flex items-end p-12">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">Visit Our Office</h3>
                  <p className="text-blue-100">Experience innovation firsthand at our Hyderabad facility</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certification Badge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Award className="w-12 h-12" />
            <h3 className="text-3xl font-bold">ISO 9001:2015 Certified</h3>
          </div>
          <p className="text-lg text-green-50 max-w-2xl mx-auto">
            Our commitment to quality is validated by international standards, ensuring you receive products that meet the highest benchmarks of excellence
          </p>
        </div>
      </section>
    </div>
  );
}

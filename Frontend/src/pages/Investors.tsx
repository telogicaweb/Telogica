
import { TrendingUp, DollarSign, FileText, Calendar, Award, Users } from 'lucide-react';

export default function Investors() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-900 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Investor Relations</h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
              Building sustainable value for our shareholders and stakeholders
            </p>
          </div>
        </div>
      </section>

      {/* Financial Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Financial Highlights (FY 2024)</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <DollarSign className="text-green-600 mb-4" size={40} />
            <h3 className="text-gray-600 text-sm font-medium mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">₹450 Cr</p>
            <p className="text-green-600 text-sm mt-2">↑ 28% YoY</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <TrendingUp className="text-blue-600 mb-4" size={40} />
            <h3 className="text-gray-600 text-sm font-medium mb-2">EBITDA</h3>
            <p className="text-3xl font-bold text-gray-900">₹135 Cr</p>
            <p className="text-green-600 text-sm mt-2">↑ 32% YoY</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <Award className="text-purple-600 mb-4" size={40} />
            <h3 className="text-gray-600 text-sm font-medium mb-2">Net Profit</h3>
            <p className="text-3xl font-bold text-gray-900">₹90 Cr</p>
            <p className="text-green-600 text-sm mt-2">↑ 35% YoY</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <Users className="text-orange-600 mb-4" size={40} />
            <h3 className="text-gray-600 text-sm font-medium mb-2">Market Cap</h3>
            <p className="text-3xl font-bold text-gray-900">₹2,800 Cr</p>
            <p className="text-green-600 text-sm mt-2">↑ 42% YoY</p>
          </div>
        </div>
      </section>

      {/* Stock Information */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Stock Information</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Company Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Stock Symbol</span>
                  <span className="font-semibold text-gray-900">TELOGICA</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Exchange</span>
                  <span className="font-semibold text-gray-900">NSE, BSE</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">ISIN</span>
                  <span className="font-semibold text-gray-900">INE123A01012</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Industry</span>
                  <span className="font-semibold text-gray-900">Technology</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed Since</span>
                  <span className="font-semibold text-gray-900">2018</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Current Trading Data</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Current Price</span>
                  <span className="font-semibold text-green-600">₹1,245.50</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">52-Week High</span>
                  <span className="font-semibold text-gray-900">₹1,389.00</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">52-Week Low</span>
                  <span className="font-semibold text-gray-900">₹845.00</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">P/E Ratio</span>
                  <span className="font-semibold text-gray-900">28.5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dividend Yield</span>
                  <span className="font-semibold text-gray-900">1.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reports & Downloads */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Reports & Presentations</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Annual Report 2024', date: 'March 31, 2024', type: 'PDF', size: '4.2 MB' },
            { title: 'Q4 2024 Results', date: 'December 1, 2024', type: 'PDF', size: '1.8 MB' },
            { title: 'Investor Presentation Q4 2024', date: 'December 1, 2024', type: 'PDF', size: '3.5 MB' },
            { title: 'Annual Report 2023', date: 'March 31, 2023', type: 'PDF', size: '3.9 MB' },
            { title: 'Q3 2024 Results', date: 'September 30, 2024', type: 'PDF', size: '1.6 MB' },
            { title: 'Corporate Governance Report', date: 'June 30, 2024', type: 'PDF', size: '2.1 MB' },
          ].map((report, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <FileText className="text-blue-600 mb-4" size={40} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar size={16} />
                <span>{report.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{report.type} • {report.size}</span>
                <button className="text-blue-600 font-medium hover:text-blue-800">Download</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Upcoming Events</h2>
          <div className="space-y-4">
            {[
              { event: 'Annual General Meeting 2025', date: 'January 15, 2025', time: '10:00 AM IST' },
              { event: 'Q1 2025 Earnings Call', date: 'March 15, 2025', time: '3:00 PM IST' },
              { event: 'Investor Conference - Mumbai', date: 'February 20, 2025', time: '9:00 AM IST' },
            ].map((event, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{event.event}</h3>
                  <p className="text-gray-600">{event.time}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={20} />
                  <span className="font-medium">{event.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact IR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Investor Relations Contact</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            For any investor-related queries, please reach out to our dedicated IR team
          </p>
          <div className="space-y-2">
            <p className="text-lg">Email: investors@telogica.com</p>
            <p className="text-lg">Phone: +91-22-1234-5678</p>
          </div>
        </div>
      </section>
    </div>
  );
}

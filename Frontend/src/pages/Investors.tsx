import { useEffect, useState } from 'react';
import { FileText, Calendar, Download, Building2 } from 'lucide-react';
import api from '../api';

interface InvestorDocument {
  _id: string;
  title: string;
  category: string;
  description?: string;
  documentUrl: string;
  fileSize?: string;
  fileType: string;
  publishDate: string;
  isActive: boolean;
  displayOrder: number;
}

export default function Investors() {
  const [documents, setDocuments] = useState<Record<string, InvestorDocument[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestorDocuments();
  }, []);

  const fetchInvestorDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/investor-documents');
      setDocuments(data);
      setCategories(Object.keys(data).sort());
    } catch (error) {
      console.error('Error fetching investor documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url: string, title: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-800 text-white py-20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Investor Relations</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Access comprehensive financial reports, presentations, and shareholder information
            </p>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Investor Documents</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Download our latest financial reports, regulatory filings, and investor presentations
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No investor documents available at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">Please check back later for updates.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {categories.map((category) => (
              <div key={category}>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <span className="h-1 w-12 bg-indigo-600 rounded"></span>
                    {category}
                  </h3>
                  <p className="text-gray-600 ml-15">Browse {category.toLowerCase()} and related materials</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents[category]?.map((doc) => (
                    <div 
                      key={doc._id} 
                      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 hover:border-indigo-200"
                      onClick={() => handleDownload(doc.documentUrl, doc.title)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-600 transition-colors">
                          <FileText className="text-indigo-600 group-hover:text-white transition-colors" size={24} />
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          {doc.fileType}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {doc.title}
                      </h4>
                      
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar size={16} />
                          <span>{new Date(doc.publishDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        {doc.fileSize && (
                          <span className="text-xs text-gray-500">{doc.fileSize}</span>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors font-medium text-sm group-hover:bg-indigo-600 group-hover:text-white">
                          <Download size={16} />
                          Download Document
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact IR Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Investor Relations Contact</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            For any investor-related queries, financial information, or shareholder services
          </p>
          <div className="space-y-2">
            <p className="text-lg font-medium">Email: investors@telogica.com</p>
            <p className="text-lg font-medium">Phone: +91-22-1234-5678</p>
          </div>
        </div>
      </section>
    </div>
  );
}

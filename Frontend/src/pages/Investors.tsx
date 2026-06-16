import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Calendar, ExternalLink, Building2, ChevronRight, Mail, Phone } from 'lucide-react';
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

const DocumentSkeleton = () => (
  <div className="bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] p-5 space-y-4 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      <div className="w-12 h-5 bg-gray-100 rounded-full" />
    </div>
    <div className="h-4 bg-gray-200 rounded w-4/5 mt-3" />
    <div className="h-3 bg-gray-100 rounded w-full" />
    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
      <div className="h-3 bg-gray-100 rounded w-24" />
      <div className="h-3 bg-gray-100 rounded w-10" />
    </div>
    <div className="h-9 bg-gray-200 rounded w-full mt-4" />
  </div>
);

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

  const handleDownload = async (doc: InvestorDocument) => {
    // Open a new tab immediately to prevent popup blockers from blocking it
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      // Fallback if popups are completely blocked
      window.open(doc.documentUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    newWindow.document.write('<p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #4b5563;">Loading document...</p>');

    try {
      const response = await fetch(doc.documentUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      
      const fileTypeLower = (doc.fileType || '').toLowerCase();
      const mimeType = fileTypeLower === 'pdf' ? 'application/pdf' : 
                       fileTypeLower === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                       fileTypeLower === 'word' ? 'application/msword' : 
                       fileTypeLower === 'powerpoint' ? 'application/vnd.ms-powerpoint' : 'application/octet-stream';
                       
      const newBlob = new Blob([blob], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(newBlob);
      
      newWindow.location.href = blobUrl;
    } catch (error) {
      console.error('Failed to preview document:', error);
      newWindow.close();
      // Fallback: open direct URL
      window.open(doc.documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Combined Header (Breadcrumbs + Hero Banner) */}
      <section className="bg-slate-900 text-white pt-10 pb-8 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col">
          {/* Integrated Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] mb-4">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <span className="text-white font-medium">Investor Relations</span>
          </div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1.2 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 rounded-full border border-white/5 backdrop-blur-md">
              <Building2 className="w-3 h-3 text-blue-400 mr-1.5" />
              <span>Financial Transparency</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mt-4 leading-tight">
              Investor Relations
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-indigo-200/80 mt-3 max-w-2xl mx-auto leading-relaxed font-light">
              Access comprehensive financial reports, presentations, and shareholder information
            </p>
          </motion.div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Investor Documents</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xl mx-auto">
            Download our latest financial reports, regulatory filings, and investor presentations
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <DocumentSkeleton key={i} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] max-w-xl mx-auto p-8">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-sm font-bold text-gray-900 mb-1">No documents found</h3>
            <p className="text-xs text-gray-500 leading-relaxed">No investor documents are available at the moment. Please check back later for updates.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-1 w-8 bg-indigo-600 rounded"></span>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{category}</h3>
                  <div className="flex-grow h-px bg-gray-200" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents[category]?.map((doc) => (
                    <motion.div
                      key={doc._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="group bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.14),0_14px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all duration-300 p-5 flex flex-col justify-between border border-gray-100 hover:border-indigo-100 bg-gradient-to-b from-indigo-50/5 to-white"
                      onClick={() => handleDownload(doc)}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-indigo-50 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center mb-1 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold uppercase rounded-full">
                            {doc.fileType}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors duration-200">
                          {doc.title}
                        </h4>

                        {doc.description && (

                          <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{doc.description}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col">
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(doc.publishDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </div>
                          {doc.fileSize && (
                            <span className="font-mono bg-indigo-50/30 text-indigo-600 py-0.5 px-1.5 rounded border border-indigo-100/30 font-bold">{doc.fileSize}</span>
                          )}
                        </div>

                        <button
                          className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors duration-200 mt-4"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact IR Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 mt-8">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Investor Relations Contact
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-md leading-relaxed">
              For any investor-related queries, financial filings, or shareholder services, please reach out directly to our support team.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Email split box */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl flex gap-3 items-center w-full lg:w-80 shadow-sm">
              <Mail className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Email IR Directory</span>
                <a href="mailto:investors@telogica.com" className="font-bold text-gray-900 text-xs hover:text-green-600 transition-colors">
                  investors@telogica.com
                </a>
              </div>
            </div>

            {/* Phone split box */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex gap-3 items-center w-full lg:w-80 shadow-sm">
              <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Phone Hotline</span>
                <a href="tel:+912212345678" className="font-bold text-gray-900 text-xs hover:text-blue-600 transition-colors">
                  +91-22-1234-5678
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

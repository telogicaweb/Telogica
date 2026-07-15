import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

// Utility to format database category names into standard elegant text matching the reference styles
const formatCategoryName = (name: string) => {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  
  if (lower === 'other information') {
    return 'Other Information';
  }
  if (lower === 'closure of trading window') {
    return 'Closure Of Trading Window';
  }
  if (lower === 'integrated governance') {
    return 'Integrated Governance';
  }
  if (lower === 'corporate announcement') {
    return 'Corporate Announcement';
  }
  if (lower.includes('new name and old name') || lower.includes('new name')) {
    return 'new name and old name of the listed entity';
  }
  if (lower.includes('terms & conditions') || lower.includes('terms and conditions')) {
    return 'Terms and conditions of appointment of Independent directors';
  }
  if (lower.includes('related party') || lower.includes('related-party')) {
    return 'Policy on dealing with related party transactions';
  }
  if (lower.includes('grievance') || lower.includes('email address')) {
    return 'email address for grievance redresal and other relevant details';
  }
  if (lower.includes('committee') || lower.includes('committes') || lower.includes('various committes')) {
    return 'Composition of various committes of Board of Directors';
  }
  if (lower.includes('egm') || lower.includes('extraordinary')) {
    return 'EGM Notices';
  }
  if (lower.includes('secretarial') || lower.includes('compliance report')) {
    return 'Secretarial Compliance Reports';
  }
  if (lower.includes('annual report') || lower.includes('annual reports')) {
    return 'Annual Reports';
  }

  // General fallback
  return name;
};

export default function Investors() {
  const [documents, setDocuments] = useState<Record<string, InvestorDocument[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestorDocuments();
  }, []);

  const fetchInvestorDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/investor-documents');
      setDocuments(data);
      
      const fetchedCats = Object.keys(data);
      
      // Fixed list of categories to match the ordering in the sidebar
      const sidebarOrder = [
        'Other Information',
        'Closure Of Trading Window',
        'Integrated Governance',
        'Corporate Announcement',
        'New Name And Old Name Of The Listed Entity',
        'Terms & Conditions of Independent Directors',
        'policy on dealing with related party transactions',
        'Email Address For Grievance Redresal And Other Relevant Details',
        'Composition Of Various Committes Of Board Of Directors',
        'Egm Notices',
        'Secretarial Compliance Reports',
        'Annual Reports',
        'Quarterly Financial Results'
      ];

      // Sort categories: follow sidebarOrder if present, then sort the rest alphabetically
      const sorted = fetchedCats.sort((a, b) => {
        const indexA = sidebarOrder.findIndex(cat => cat.toLowerCase() === a.toLowerCase());
        const indexB = sidebarOrder.findIndex(cat => cat.toLowerCase() === b.toLowerCase());
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });
      
      setCategories(sorted);

      // Default select "Annual Reports" if available, otherwise first category
      if (sorted.length > 0) {
        const defaultCat = sorted.find(c => c.toLowerCase() === 'annual reports') || sorted[0];
        setSelectedCategory(defaultCat);
      }
    } catch (error) {
      console.error('Error fetching investor documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: InvestorDocument) => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
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
      window.open(doc.documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Page Header Banner */}
      <section className="bg-black text-white py-8 border-b border-[#222222] relative overflow-hidden">
        {/* Geometric patterns on the right to match the original style */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
          <div className="w-full h-full bg-[linear-gradient(45deg,#000_25%,transparent_25%),linear-gradient(-45deg,#000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0055bb_75%),linear-gradient(-45deg,transparent_75%,#0055bb_75%)] bg-[length:20px_20px]" />
        </div>
        
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto relative z-10 flex flex-row items-center justify-between">
          <h1 className="text-3xl font-normal tracking-wide">
            Investors
          </h1>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-normal">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="text-gray-500">/</span>
            <span className="font-semibold text-white">Investors</span>
          </div>
        </div>
      </section>

      {/* Main Layout Container - Uses fluid flex for maximizing space */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column (Categories Menu) - Fixed Width on Desktop */}
          <div className="w-full lg:w-80 flex-shrink-0">
            {/* Mobile Category Dropdown Selector */}
            <div className="block lg:hidden mb-6">
              <label htmlFor="category-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Category
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-800 rounded-none shadow-sm font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategoryName(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Category Sidebar */}
            <div className="hidden lg:block bg-[#7d0575] rounded-none border border-[#680261]">
              <nav className="divide-y divide-[#680261]">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-5 py-4 text-[13px] font-normal leading-tight transition-all duration-150 flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#5c0256] text-white font-semibold'
                          : 'text-white hover:bg-[#6f0368]'
                      }`}
                    >
                      <span className="pr-2">{formatCategoryName(cat)}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right Column (Documents Details Pane) - Stretches to fill available width */}
          <div className="flex-1 min-w-0 w-full pl-0 lg:pl-4">
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 animate-pulse w-full mb-6" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-white flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            ) : !selectedCategory ? (
              <div className="text-center py-20">
                <p className="text-sm text-gray-500">Please select a category from the sidebar menu.</p>
              </div>
            ) : (
              <div className="flex flex-col w-full">
                
                {/* Header panel for selected category (matching grey bar structure from reference) */}
                <div className="bg-[#efefef] px-5 py-3.5 mb-6 w-full">
                  <h2 className="text-[26px] font-normal text-[#333333] leading-tight">
                    {formatCategoryName(selectedCategory)}
                  </h2>
                </div>

                {/* List of files with Red circular PDF icons */}
                <div className="space-y-5 w-full">
                  {(!documents[selectedCategory] || documents[selectedCategory].length === 0) ? (
                    <div className="py-10 text-center">
                      <p className="text-sm text-gray-400">No documents found under this category.</p>
                    </div>
                  ) : (
                    documents[selectedCategory].map((doc) => (
                      <div
                        key={doc._id}
                        onClick={() => handleDownload(doc)}
                        className="flex items-center cursor-pointer group py-2 hover:bg-slate-50 transition-colors px-2 -mx-2"
                      >
                        {/* Circular Red File/PDF Icon wrapper */}
                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#bd0000] flex items-center justify-center text-white mr-4 shadow-sm">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M8 13h2" />
                            <path d="M8 17h8" />
                            <path d="M10 9H8" />
                          </svg>
                        </div>
                        
                        <span className="text-[15px] font-normal text-[#333333] group-hover:text-red-700 group-hover:underline transition-all duration-150">
                          {doc.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

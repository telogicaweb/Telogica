import { Facebook, Linkedin, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <p className="text-xs text-indigo-300 uppercase tracking-widest">Head Office</p>
            <p className="text-sm text-gray-200 leading-relaxed">
              TELOGICA LIMITED<br />
              Empire Square, Plot No 233-A, 234 &amp; 235,<br />
              3rd Fl, Rd No 36, Jubilee Hills,<br />
              Hyderabad - 500 033, Telangana, India
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-indigo-300 uppercase tracking-widest">Contact</p>
            <p className="text-sm text-gray-200">sales@telogica.com</p>
            <p className="text-sm text-gray-200">support@telogica.com</p>
            <p className="text-sm text-gray-200">+91 9396610682</p>
            <p className="text-sm text-gray-200">+91-40-27531324 to 26</p>
            <p className="text-sm text-gray-200">+91-40-27535423</p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/aishwaryatechtele"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.youtube.com/user/aishwaryatechtele"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/telogica-limited/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
            <nav className="flex flex-col text-sm gap-2">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">
                Terms &amp; Conditions
              </Link>
              <Link to="/site-map" className="text-gray-400 hover:text-white transition-colors">
                Site Map
              </Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 text-xs text-gray-500 text-center">
          © 2025 TELOGICA LIMITED. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

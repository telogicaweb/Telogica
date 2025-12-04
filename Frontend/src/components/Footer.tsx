import { Facebook, Linkedin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-400">
            © 2025 TELOGICA. All rights reserved
          </div>

          <div className="flex items-center gap-8">
            <div className="flex gap-6">
              <a
                href="#facebook"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#linkedin"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="tel:+1234567890"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Phone"
              >
                <Phone size={20} />
              </a>
            </div>

            <div className="h-6 w-px bg-gray-700" />

            <nav className="flex gap-6 text-sm">
              <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#terms" className="text-gray-400 hover:text-white transition-colors">
                Terms & Conditions
              </a>
              <a href="#sitemap" className="text-gray-400 hover:text-white transition-colors">
                Site Map
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

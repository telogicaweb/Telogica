import { Link } from 'react-router-dom';

const SiteMap = () => {
  const productCategories = [
    { label: 'Telecommunication', anchor: '/products#Telecommunication' },
    { label: 'Defence', anchor: '/products#Defence' },
    { label: 'Manufacturing', anchor: '/products#Manufacturing' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Site map & quick navigation</p>
          <h1 className="text-4xl font-bold text-gray-900">Site Map</h1>
          <p className="text-gray-600">
            Navigate through the Telogica digital experience. We focus on telecom, defence, manufacturing, and support services
            with a fully connected customer journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Core Pages</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>
                <Link to="/" className="hover:text-indigo-600 hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-indigo-600 hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/investors" className="hover:text-indigo-600 hover:underline">
                  Investors
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-indigo-600 hover:underline">
                  Blog & Insights
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-indigo-600 hover:underline">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>
                <Link to="/products" className="hover:text-indigo-600 hover:underline">
                  Product Portal
                </Link>
              </li>
              {productCategories.map((category) => (
                <li key={category.label}>
                  <Link to={category.anchor} className="hover:text-indigo-600 hover:underline">
                    {category.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/quote" className="hover:text-indigo-600 hover:underline">
                  Request a Quote
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Support</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>
                <Link to="/warranty" className="hover:text-indigo-600 hover:underline">
                  Warranty Registration
                </Link>
              </li>
              <li>
                <Link to="/retailer-inventory" className="hover:text-indigo-600 hover:underline">
                  Retailer Inventory
                </Link>
              </li>
              <li>
                <Link to="/quote" className="hover:text-indigo-600 hover:underline">
                  Quote History
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-indigo-600 hover:underline">
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Corporate & Contact</h2>
            <p className="text-gray-700 text-sm">
              Telogica Limited
              <br />
              Empire Square, Plot No 233-A, 234 &amp; 235, 3rd Floor, Road No 36, Jubilee Hills, Hyderabad - 500033, Telangana, India
            </p>
            <p className="text-sm text-gray-600 space-y-1">
              <span>
                Sales: <a href="mailto:sales@telogica.com" className="text-indigo-600 hover:underline">sales@telogica.com</a>
              </span>
              <span>
                Support: <a href="mailto:support@telogica.com" className="text-indigo-600 hover:underline">support@telogica.com</a>
              </span>
              <span>
                Phone: <a href="tel:+919396610682" className="text-indigo-600 hover:underline">+91 9396610682</a>
              </span>
              <span>
                Phone: <a href="tel:+914027531324" className="text-indigo-600 hover:underline">+91-40-27531324 to 26</a>
              </span>
              <span>
                Phone: <a href="tel:+914027535423" className="text-indigo-600 hover:underline">+91-40-27535423</a>
              </span>
            </p>
            <div className="text-gray-600 text-sm">
              © 2025 Telogica Limited. All rights reserved.
            </div>
          </div>
      </div>
    </div>
  );
};

export default SiteMap;

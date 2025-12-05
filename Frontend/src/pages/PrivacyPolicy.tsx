import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-500">Last updated December 2025</p>
        <h1 className="text-4xl font-bold text-gray-900 mt-3">Privacy Policy</h1>
        <p className="text-gray-600 mt-4 text-lg">
          Telogica Ltd (formerly Aishwarya Technologies and Telecom Ltd) respects your privacy and is committed to keeping
          the information you entrust to us safe. This policy explains how we collect, use, and protect your personal data
          when you interact with our digital services, including this website and our customer portals.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Contact details such as name, email, phone number, company, and postal address.</li>
            <li>Account data including user credentials when you register for an account or admin area.</li>
            <li>Transactional details for quotes, orders, warranty registrations, and support requests.</li>
            <li>Technical metadata such as device identifiers, cookies, and browsing behavior on our site.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">How We Use Your Information</h2>
          <p className="text-gray-700">
            The data we collect helps us personalize communications, deliver tailored product information, fulfill orders,
            maintain warranty and support records, and improve our platforms. We also use this information to comply with
            legal obligations and to protect against fraud.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Sharing and Disclosure</h2>
          <p className="text-gray-700">
            We never sell your personal information. We may share data with trusted partners that help us deliver services,
            such as cloud hosting providers, payment processors, logistics partners, and marketing agencies. These vendors
            are contractually obligated to treat your data responsibly and only use it for the purposes we specify.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Cookies & Tracking</h2>
          <p className="text-gray-700">
            Our site uses cookies and similar technologies to remember your preferences, analyze website performance, and
            suggest relevant products. You can manage cookie preferences through your browser, but disabling certain
            cookies may limit functionality.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Security & Retention</h2>
          <p className="text-gray-700">
            We employ encryption, access controls, and monitoring to protect your data. We retain your information only as
            long as necessary to provide the services you request, comply with legal obligations, or resolve disputes.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Your Rights</h2>
          <p className="text-gray-700">
            You can request access to the details we maintain, ask for corrections, or opt out of marketing communications.
            To exercise these rights or for any questions about this policy, contact us at{' '}
            <a href="mailto:support@telogica.com" className="text-indigo-600 hover:underline">
              support@telogica.com
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Need to Speak With Us?</h2>
          <p className="text-gray-700">
            Telogica Ltd operates from Jubilee Hills, Hyderabad, and is proud to serve defense, telecom, and manufacturing
            organizations across India. For billing, warranty, and product inquiries, you can also reach us at{' '}
            <a href="tel:+91-40-27531324" className="text-indigo-600 hover:underline">
              +91-40-27531324
            </a>{' '}
            or visit our{' '}
            <Link to="/contact" className="text-indigo-600 hover:underline">
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

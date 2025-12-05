import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <p className="text-sm text-gray-500">Agreement effective December 2025</p>
        <h1 className="text-4xl font-bold text-gray-900">Terms & Conditions</h1>
        <p className="text-gray-700 text-lg">
          These Terms and Conditions describe how Telogica Ltd (formerly Aishwarya Technologies and Telecom Ltd) operates
          this website and the services offered through it, including product cataloguing, quote management, and warranty
          registration platforms.
        </p>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Use of the Website</h2>
          <p className="text-gray-700">
            You agree to use this site and our services in compliance with applicable laws. Respect intellectual property
            rights, refrain from misrepresenting yourself, and keep your account credentials secure. We reserve the right
            to suspend access for any user who violates these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Product & Quote Information</h2>
          <p className="text-gray-700">
            Product descriptions, availability, and pricing are provided for informational purposes. Any order or quote
            request must be confirmed in writing by our sales team. We may revise specifications, pricing, or delivery
            schedules at our discretion, but we will notify you before confirming an order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Payments & Cancellations</h2>
          <p className="text-gray-700">
            All invoices are payable according to the payment terms listed on your quote. Late payments may incur interest
            or suspend future deliveries. Cancellation requests must be submitted in writing. Orders for custom or quote-only
            products may carry non-refundable costs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Warranty & Support</h2>
          <p className="text-gray-700">
            Warranty coverage is outlined in the product documentation issued at the time of delivery. Registering serial
            numbers and model information via our{' '}
            <Link to="/warranty" className="text-indigo-600 hover:underline">
              Warranty Registration
            </Link>{' '}
            page helps us provide faster service. Support requests are handled through our customer support desk or by
            email at{' '}
            <a href="mailto:support@telogica.com" className="text-indigo-600 hover:underline">
              support@telogica.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Limitation of Liability</h2>
          <p className="text-gray-700">
            Telogica aims to ensure the accuracy of the content on this website, but we do not guarantee it is complete or error-free.
            Except where prohibited by law, we are not liable for damages arising from the use of this site or the products listed
            herein.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Governing Law</h2>
          <p className="text-gray-700">
            These Terms are governed by the laws of India and any dispute shall be subject to the exclusive jurisdiction of courts
            in Hyderabad. If any part of these Terms is found to be unenforceable, the remainder will continue in full force and effect.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditions;

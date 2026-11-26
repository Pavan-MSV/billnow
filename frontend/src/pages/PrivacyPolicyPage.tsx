import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, FileText, CheckCircle2 } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg text-ink py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Navigation back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to BillNow</span>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-subtle mt-0.5">Last updated: November 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-sm space-y-6 text-sm text-subtle leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
              1. Our Commitment to Your Privacy
            </h2>
            <p>
              BillNow (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is built on the core principle that your purchase receipts, warranty terms, and personal belongings data belong exclusively to you. We do not sell, rent, monetize, or share your personal data with third-party advertising networks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Database className="h-4 w-4 text-brand-600" />
              2. Information We Collect
            </h2>
            <p>We collect and securely store only the information required to deliver the BillNow service:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Account Credentials:</strong> Name, email address, mobile number, and cryptographically salted password hashes.</li>
              <li><strong>Product & Warranty Details:</strong> Product names, categories, brands, model and serial numbers, purchase prices, purchase dates, warranty start and expiration dates, and seller notes.</li>
              <li><strong>Uploaded Invoices:</strong> Image and PDF receipt documents uploaded to your vault.</li>
              <li><strong>Service Logs:</strong> Maintenance histories, repair costs, and provider contacts.</li>
              <li><strong>Device Push Tokens:</strong> Firebase Cloud Messaging (FCM) tokens to deliver scheduled expiration push alerts to your mobile device.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Lock className="h-4 w-4 text-brand-600" />
              3. Cloud Infrastructure & File Security
            </h2>
            <p>
              Your data is hosted exclusively on secure enterprise cloud providers with zero public accessibility:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Database:</strong> Stored on Neon PostgreSQL Serverless with encrypted transit (SSL/TLS) and isolated tenant partitioning.</li>
              <li><strong>Invoice Vault:</strong> Stored in private Cloudflare R2 object storage. Invoices are accessible only via time-limited (15-minute) pre-signed URLs generated after verifying your active session.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Eye className="h-4 w-4 text-brand-600" />
              4. Data Portability & Complete Account Deletion
            </h2>
            <p>
              You maintain 100% control over your data at all times:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Data Export:</strong> You can download a complete dump of your products and warranties anytime in structured JSON or CSV spreadsheet formats.</li>
              <li><strong>Account Deletion:</strong> You can delete your account permanently within your Account Settings or via our public <Link to="/delete-account" className="text-brand-600 underline font-semibold">Verified Deletion Request Form</Link>. Deletion instantly purges all database records and physically deletes all invoice files from cloud storage.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-600" />
              5. Contact Us
            </h2>
            <p>
              For privacy inquiries, GDPR data requests, or compliance concerns, contact our privacy officer directly at:
            </p>
            <p className="font-semibold text-ink">privacy@billnow.app</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;

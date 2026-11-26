import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export function TermsPage() {
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
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Terms and Conditions</h1>
            <p className="text-xs text-subtle mt-0.5">Last updated: November 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-sm space-y-6 text-sm text-subtle leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the BillNow mobile application or website, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, please refrain from using our application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              2. Nature of the Service
            </h2>
            <p>
              BillNow provides digital tracking tools designed to help consumers store purchase receipts, track manufacturer warranty countdowns, schedule service appointments, and receive alert reminders.
            </p>
            <p className="mt-1">
              BillNow is an independent utility application. We are not an insurance underwriter, extended warranty issuer, or authorized repair affiliate of product manufacturers unless explicitly designated.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              3. Manufacturer Warranties & Claim Limitations
            </h2>
            <p>
              All manufacturer warranty terms, coverage scopes, claim approvals, and repair policies remain subject exclusively to the original seller and manufacturer contracts. BillNow does not guarantee that any manufacturer will approve warranty claims submitted by users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
              4. User Responsibilities
            </h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>Upload only legitimate documents belonging to you or your household/business.</li>
              <li>Refrain from uploading malicious code, copyrighted material without permission, or defamatory content.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-600" />
              5. Account Termination
            </h2>
            <p>
              You may terminate your account at any time through Account Settings or through our verified deletion form. BillNow reserves the right to suspend or terminate accounts that violate our terms or misuse system resources.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;

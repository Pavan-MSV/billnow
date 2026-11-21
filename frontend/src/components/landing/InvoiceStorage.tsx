import { Download, FileImage, FileText, FolderLock, ShieldCheck } from 'lucide-react';

import { SectionHeading } from './SectionHeading';

const FILES = [
  { name: 'invoice-macbook-pro.pdf', size: '312 KB', type: 'pdf' },
  { name: 'washing-machine-bill.jpg', size: '1.4 MB', type: 'image' },
  { name: 'galaxy-s21-purchase.pdf', size: '248 KB', type: 'pdf' },
];

/** Invoice Storage section. */
export function InvoiceStorage() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-pop">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <FolderLock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-ink">Invoices</p>
                <p className="text-xs text-subtle">Encrypted at rest · private to your account</p>
              </div>
            </div>
            <ul className="mt-5 divide-y divide-line">
              {FILES.map((file) => (
                <li key={file.name} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-elevated text-subtle">
                    {file.type === 'pdf' ? (
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <FileImage className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{file.name}</span>
                    <span className="block text-xs text-subtle">{file.size}</span>
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-subtle">
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-elevated px-3 py-2 text-xs text-subtle">
              <ShieldCheck className="h-4 w-4 text-success-600 dark:text-success-400" aria-hidden="true" />
              PDF, JPG and PNG up to 10 MB per file
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeading
            align="left"
            eyebrow="Invoice storage"
            title="Your bills, safe and always findable"
            description="Stop hunting through email and shoeboxes. Attach the invoice once and it stays with the product forever — ready for warranty claims, resale or records."
          />
          <ul className="mt-8 space-y-4">
            {[
              'Upload PDFs or photos straight from your phone.',
              'View or download any invoice in a single click.',
              'Replace or remove a file whenever things change.',
              'Every upload is tied to the product it belongs to.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-subtle">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default InvoiceStorage;

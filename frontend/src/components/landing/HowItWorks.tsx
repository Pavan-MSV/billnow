import { BellRing, FileText, PackagePlus } from 'lucide-react';

import { SectionHeading } from './SectionHeading';

const STEPS = [
  {
    icon: PackagePlus,
    title: 'Add your product',
    description:
      'Record the brand, model, serial number and purchase details in a few seconds — or paste them from your invoice.',
  },
  {
    icon: FileText,
    title: 'Attach the invoice',
    description:
      'Upload the PDF or photo of your bill. BillNow stores it securely and links it to the product for instant access.',
  },
  {
    icon: BellRing,
    title: 'Get reminded in time',
    description:
      'We track every warranty date and notify you 90, 60, 30, 7 and 1 day before coverage ends — so you never miss a claim.',
  },
];

/** "How BillNow Works" — three clear steps. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="How BillNow works"
          title="Three simple steps to total peace of mind"
          description="From the shop counter to the service centre, BillNow keeps every detail organised — automatically."
        />

        <ol className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-subtle">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;

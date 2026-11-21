import { PublicNavbar } from '../components/landing/PublicNavbar';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Features } from '../components/landing/Features';
import { WarrantyTracking } from '../components/landing/WarrantyTracking';
import { InvoiceStorage } from '../components/landing/InvoiceStorage';
import { DashboardPreview } from '../components/landing/DashboardPreview';
import { SecurityPrivacy } from '../components/landing/SecurityPrivacy';
import { CallToAction } from '../components/landing/CallToAction';
import { Footer } from '../components/landing/Footer';

/** Public marketing landing page. */
export function LandingPage() {
  return (
    <div className="bg-bg">
      <PublicNavbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <WarrantyTracking />
        <InvoiceStorage />
        <DashboardPreview />
        <SecurityPrivacy />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;

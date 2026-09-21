import { Metadata } from 'next';
import ContactClient from '@/components/contact/ContactClient';
import { getSiteSettings } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Contact Us | Arboveya Botanical Herbal Care',
  description: 'Reach out to Arboveya apothecary team. Buyers and sellers can contact our administration directly for order support, botanical guidance, and merchant inquiries.',
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return <ContactClient initialSettings={settings} />;
}

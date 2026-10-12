import { Metadata } from 'next';
import ContactClient from '@/components/contact/ContactClient';
import { getSiteSettings } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Contact Us | Arboveya',
  description: 'Reach out to the Arboveya team. Buyers and sellers can contact our administration directly for order support and inquiries.',
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return <ContactClient initialSettings={settings} />;
}

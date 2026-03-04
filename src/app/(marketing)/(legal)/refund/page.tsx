import { Metadata } from 'next';
import { LEGAL_LAST_UPDATED, SUPPORT_EMAIL, toSectionId } from '../constants';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'Refund policy for Kytbox subscriptions and purchases.',
  alternates: {
    canonical: '/refund',
  },
};

const SECTIONS = [
  {
    title: '14-Day Money-Back Guarantee',
    content: (
      <p>
        For new subscriptions (Pro plans), we offer a 14-day money-back
        guarantee. If you cancel your subscription within 14 days of your
        initial purchase, you can request a full refund.
      </p>
    ),
  },
  {
    title: 'How to Request a Refund',
    content: (
      <>
        <p>
          Since Lemon Squeezy handles the financial transaction, we can process
          refunds directly through their system. You do not need to contact
          them; simply contact us:
        </p>
        <ul>
          <li>
            Email us at{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              aria-label='Email Kytbox support'
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            with your account email and date of purchase.
          </li>
          <li>We will trigger the refund via the Lemon Squeezy dashboard.</li>
        </ul>
        <p>
          Once triggered, the funds will be returned to your original payment
          method by Lemon Squeezy (typically within 5-10 business days,
          depending on your bank).
        </p>
      </>
    ),
  },
  {
    title: 'Exceptions',
    content: (
      <>
        <p>Refunds are not available for:</p>
        <ul>
          <li>
            Renewal charges if not cancelled prior to the renewal date (unless
            required by law).
          </li>
          <li>Purchases made more than 14 days ago.</li>
          <li>
            Annual subscriptions beyond the 14-day refund window (annual plans
            are not pro-rated upon cancellation).
          </li>
          <li>
            Accounts suspended or terminated for violation of our Terms of
            Service.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Cancellation',
    content: (
      <p>
        You can cancel your subscription at any time from your account settings.
        If you cancel after the 14-day refund window, your subscription will
        remain active until the end of the current billing period, and you will
        not be charged again.
      </p>
    ),
  },
  {
    title: 'Statutory Rights',
    content: (
      <p>
        This refund policy does not affect your statutory consumer rights under
        applicable law, including but not limited to Indonesian consumer
        protection regulations (UU No. 8/1999) and the EU Consumer Rights
        Directive. Where statutory rights provide greater protection than this
        policy, your statutory rights shall prevail.
      </p>
    ),
  },
  {
    title: 'Contact Us',
    content: (
      <p>
        If you have any questions about our Refund Policy, please contact us at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export default function RefundPage() {
  return (
    <>
      <h1>Refund Policy</h1>
      <p className='lead'>Last updated: {LEGAL_LAST_UPDATED}</p>

      <p>
        We want you to be satisfied with Kytbox. If you are not completely happy
        with the service, we offer a refund policy as outlined below.
      </p>

      <div className='bg-muted/50 p-4 rounded-lg my-6 border border-border/50 text-sm'>
        <strong>Note:</strong> All payments are securely processed by our
        Merchant of Record, <strong>Lemon Squeezy</strong>.
      </div>

      {SECTIONS.map((section, index) => (
        <section key={section.title} id={toSectionId(section.title)}>
          <h2>
            {index + 1}. {section.title}
          </h2>
          {section.content}
        </section>
      ))}
    </>
  );
}

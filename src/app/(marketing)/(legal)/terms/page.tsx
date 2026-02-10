import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Kytbox',
  description: 'Terms of service and usage guidelines for Kytbox.',
};

const SECTIONS = [
  {
    title: 'Introduction',
    content: (
      <p>
        Kytbox (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a
        suite of personal utility tools including Bio link pages, Cashflow
        planning, and other productivity applications (collectively, the
        &quot;Service&quot;).
      </p>
    ),
  },
  {
    title: 'Account Registration',
    content: (
      <>
        <p>
          To access certain features of the Service, you must register for an
          account. You agree to provide accurate, current, and complete
          information during the registration process and to keep your account
          information up to date.
        </p>
        <ul>
          <li>
            You are responsible for safeguarding your password and for all
            activities that occur under your account.
          </li>
          <li>
            You must notify us immediately upon becoming aware of any breach of
            security or unauthorized use of your account.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Subscriptions and Payments',
    content: (
      <>
        <p>
          Certain aspects of the Service may be provided for a fee or other
          charge. If you elect to use paid aspects of the Service, you agree to
          the pricing and payment terms as we may update them from time to time.
        </p>
        <ul>
          <li>
            <strong>Merchant of Record:</strong> Our order process is conducted
            by our online reseller and Merchant of Record, Lemon Squeezy.
            Payment processing and tax compliance are handled by Lemon Squeezy.
          </li>
          <li>
            <strong>Cancellations:</strong> You may cancel your subscription at
            any time; however, there are no refunds for cancellation unless
            specified in our Refund Policy (e.g., within the 14-day window).
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Acceptable Use',
    content: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable law, regulation, or third-party right.</li>
          <li>
            Upload, post, or distribute content that is unlawful, defamatory,
            harassing, abusive, fraudulent, obscene, or otherwise objectionable.
          </li>
          <li>
            Interfere with or disrupt the integrity or performance of the
            Service.
          </li>
          <li>
            Attempt to gain unauthorized access to the Service or its related
            systems or networks.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Intellectual Property',
    content: (
      <>
        <p>
          The Service and its original content, features, and functionality are
          and will remain the exclusive property of Kytbox and its licensors.
          The Service is protected by copyright, trademark, and other laws.
        </p>
        <p>
          Your content remains yours. By using our Service, you grant us a
          license to host, use, and display your content as necessary to provide
          the Service.
        </p>
      </>
    ),
  },
  {
    title: 'Termination',
    content: (
      <p>
        We may terminate or suspend your account immediately, without prior
        notice or liability, for any reason whatsoever, including without
        limitation if you breach the Terms. Upon termination, your right to use
        the Service will immediately cease. You may request deletion of your
        data upon account termination by contacting us.
      </p>
    ),
  },
  {
    title: 'Limitation of Liability',
    content: (
      <p>
        In no event shall Kytbox, nor its directors, employees, partners,
        agents, suppliers, or affiliates, be liable for any indirect,
        incidental, special, consequential or punitive damages, including
        without limitation, loss of profits, data, use, goodwill, or other
        intangible losses, resulting from your access to or use of or inability
        to access or use the Service.
      </p>
    ),
  },
  {
    title: 'Governing Law',
    content: (
      <p>
        These Terms shall be governed and construed in accordance with the laws
        of Indonesia, without regard to its conflict of law provisions. Any
        disputes arising under these Terms shall be subject to the exclusive
        jurisdiction of the courts of Indonesia.
      </p>
    ),
  },
  {
    title: 'Changes to Terms',
    content: (
      <p>
        We reserve the right, at our sole discretion, to modify or replace these
        Terms at any time. If a revision is material we will try to provide at
        least 30 days notice prior to any new terms taking effect.
      </p>
    ),
  },
  {
    title: 'Contact Us',
    content: (
      <p>
        If you have any questions about these Terms, please contact us at{' '}
        <a href='mailto:support@kytbox.com'>support@kytbox.com</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className='lead'>Last updated: February 10, 2026</p>

      <p>
        Welcome to Kytbox. By accessing or using our website and services, you
        agree to be bound by these Terms of Service.
      </p>

      {SECTIONS.map((section, index) => (
        <section key={section.title}>
          <h2>
            {index + 1}. {section.title}
          </h2>
          {section.content}
        </section>
      ))}
    </>
  );
}

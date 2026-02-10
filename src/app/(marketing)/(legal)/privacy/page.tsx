import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Kytbox',
  description: 'How Kytbox collects, uses, and protects your data.',
};

const SECTIONS = [
  {
    title: 'Information We Collect',
    content: (
      <>
        <p>
          We collect information that you provide directly to us, such as when
          you create an account, update your profile, or communicate with us.
          This may include:
        </p>
        <ul>
          <li>Name and contact information (email address).</li>
          <li>Authentication data (managed securely by Supabase Auth).</li>
          <li>Content you upload to the Service (bio links, cashflow data).</li>
          <li>
            Payment information (securely processed by our Merchant of Record,
            Lemon Squeezy — we do not store your payment details).
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'How We Use Your Information',
    content: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our Service.</li>
          <li>Process transactions and send related information.</li>
          <li>
            Send you technical notices, updates, security alerts, and support
            messages.
          </li>
          <li>Respond to your comments, questions, and requests.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Data Sharing',
    content: (
      <>
        <p>
          We do not sell your personal data. We may share your information with
          third-party vendors and service providers who perform services on our
          behalf, such as:
        </p>
        <ul>
          <li>Hosting and infrastructure (Vercel, Supabase).</li>
          <li>Payment processing (Lemon Squeezy).</li>
        </ul>
      </>
    ),
  },
  {
    title: 'International Data Transfers',
    content: (
      <p>
        Your data may be transferred to and processed in countries other than
        your own, including the United States (where Vercel and Lemon Squeezy
        operate). By using the Service, you consent to these transfers. We
        ensure that appropriate safeguards are in place to protect your data in
        accordance with this Privacy Policy.
      </p>
    ),
  },
  {
    title: 'Data Retention',
    content: (
      <p>
        We retain your personal data for as long as your account is active or as
        needed to provide the Service. If you delete your account, we will
        delete your personal data within 30 days, except where we are required
        to retain it for legal or compliance purposes.
      </p>
    ),
  },
  {
    title: 'Data Security',
    content: (
      <p>
        We implement appropriate technical and organizational measures to
        protect the security of your personal information. However, please be
        aware that no method of transmission over the Internet or method of
        electronic storage is 100% secure.
      </p>
    ),
  },
  {
    title: 'Your Rights',
    content: (
      <>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access and receive a copy of your personal data.</li>
          <li>Correct inaccurate personal data.</li>
          <li>Request deletion of your personal data.</li>
          <li>Restrict or object to the processing of your data.</li>
          <li>Data portability (receive your data in a structured format).</li>
        </ul>
        <p>
          You can manage most of your data directly within your account
          settings. To exercise any other rights, contact us at{' '}
          <a href='mailto:support@kytbox.com'>support@kytbox.com</a>.
        </p>
      </>
    ),
  },
  {
    title: 'Cookies',
    content: (
      <p>
        We use essential cookies for authentication and session management. We
        do not use tracking cookies or third-party advertising cookies. You can
        instruct your browser to refuse all cookies, but this may affect your
        ability to use the Service.
      </p>
    ),
  },
  {
    title: "Children's Privacy",
    content: (
      <p>
        Our Service is not addressed to anyone under the age of 13. We do not
        knowingly collect personal identifiable information from children under
        13.
      </p>
    ),
  },
  {
    title: 'Changes to This Policy',
    content: (
      <p>
        We may update our Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page and
        updating the &quot;Last updated&quot; date.
      </p>
    ),
  },
  {
    title: 'Contact Us',
    content: (
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at <a href='mailto:support@kytbox.com'>support@kytbox.com</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className='lead'>Last updated: February 10, 2026</p>

      <p>
        At Kytbox, we take your privacy seriously. This Privacy Policy explains
        how we collect, use, disclose, and safeguard your information when you
        visit our website or use our services.
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

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Kytbox',
  description: 'How Kytbox collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className='lead'>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        At Kytbox, we take your privacy seriously. This Privacy Policy explains
        how we collect, use, disclosure, and safeguard your information when you
        visit our website or use our services.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information that you provide directly to us, such as when you
        create an account, update your profile, or communicate with us. This may
        include:
      </p>
      <ul>
        <li>Name and contact information (email address).</li>
        <li>Account credentials (hashed passwords).</li>
        <li>Content you upload to the Service (bio links, cashflow data).</li>
        <li>
          Payment information (securely processed by our Merchant of Record,
          Lemon Squeezy).
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
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

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell your personal data. We may share your information with
        third-party vendors and service providers who perform services on our
        behalf, such as:
      </p>
      <ul>
        <li>Hosting and infrastructure (Vercel, Supabase).</li>
        <li>Payment processing (Lemon Squeezy).</li>
        <li>Analytics (Vercel Analytics).</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to
        protect the security of your personal information. However, please be
        aware that no method of transmission over the Internet or method of
        electronic storage is 100% secure.
      </p>

      <h2>5. Your Rights</h2>
      <p>
        Depending on your location, you may have the right to access, correct,
        delete, or restrict the use of your personal data. You can manage most
        of your data directly within your account settings.
      </p>

      <h2>6. Cookies</h2>
      <p>
        We use cookies and similar tracking technologies to track the activity
        on our Service and hold certain information. You can instruct your
        browser to refuse all cookies or to indicate when a cookie is being
        sent.
      </p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>
        Our Service is not addressed to anyone under the age of 13. We do not
        knowingly collect personal identifiable information from children under
        13.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update our Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at <a href='mailto:support@kytbox.com'>support@kytbox.com</a>.
      </p>
    </>
  );
}

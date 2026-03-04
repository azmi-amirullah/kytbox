import { Metadata } from 'next';
import {
  LEGAL_LAST_UPDATED,
  SUPPORT_EMAIL,
  LEGAL_ENTITY,
  toSectionId,
} from '../constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Kytbox collects, uses, and protects your data.',
  alternates: {
    canonical: '/privacy',
  },
};

const SECTIONS = [
  {
    title: 'Data Controller',
    content: (
      <p>
        Kytbox is operated by {LEGAL_ENTITY}, based in Indonesia. For any
        data-related inquiries, you can reach us at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    ),
  },
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
          {/* <li>
            Payment information (securely processed by our Merchant of Record,
            Lemon Squeezy — we do not store your payment details).
          </li> */}
        </ul>
        <p>
          We also automatically collect certain technical information when you
          use the Service, including server access logs (IP address, browser
          type, timestamps) for security and operational purposes. We use
          privacy-friendly analytics (Vercel Web Analytics) which does not use
          cookies and does not collect personally identifiable information.
        </p>
      </>
    ),
  },
  {
    title: 'Legal Basis for Processing (GDPR)',
    content: (
      <>
        <p>
          If you are located in the European Economic Area (EEA), we process
          your personal data under the following legal bases:
        </p>
        <ul>
          <li>
            <strong>Contract performance:</strong> Processing necessary to
            provide the Service you signed up for (account management, content
            hosting, cashflow features).
          </li>
          <li>
            <strong>Legitimate interest:</strong> Processing for security, fraud
            prevention, service improvement, and responding to support requests.
          </li>
          <li>
            <strong>Consent:</strong> Where you have given explicit consent
            (e.g., subscribing to optional notifications).
          </li>
          <li>
            <strong>Legal obligation:</strong> Processing required to comply
            with applicable laws (e.g., tax records for transactions).
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
          {/* <li>Payment processing (Lemon Squeezy).</li> */}
          <li>Rate limiting and security (Upstash).</li>
          <li>Analytics (Vercel Web Analytics — privacy-friendly, no PII).</li>
          <li>Performance monitoring (Vercel Speed Insights — no PII).</li>
        </ul>
      </>
    ),
  },
  {
    title: 'International Data Transfers',
    content: (
      <>
        <p>
          Your data may be transferred to and processed in countries other than
          your own, including the United States (where Vercel
          {/*  and Lemon Squeezy */} operates). We rely on the following
          safeguards for these transfers:
        </p>
        <ul>
          <li>
            Standard Contractual Clauses (SCCs) as approved by the European
            Commission, incorporated into our agreements with sub-processors.
          </li>
          <li>
            Adequacy decisions where applicable under the relevant data
            protection framework.
          </li>
        </ul>
        <p>
          By using the Service, you acknowledge these transfers. We ensure that
          appropriate safeguards are in place to protect your data in accordance
          with this Privacy Policy and applicable data protection laws.
        </p>
      </>
    ),
  },
  {
    title: 'Data Retention',
    content: (
      <>
        <p>
          We retain your personal data for as long as your account is active or
          as needed to provide the Service. You may request deletion of your
          account and personal data at any time by contacting us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
            {SUPPORT_EMAIL}
          </a>
          . We will process deletion requests within 30 days, except where we
          are required to retain data for legal or compliance purposes.
        </p>
        <p>
          Server access logs (including IP addresses) are retained for a
          reasonable period for security and operational purposes and are
          periodically purged.
        </p>
      </>
    ),
  },
  {
    title: 'Data Security',
    content: (
      <>
        <p>
          We implement appropriate technical and organizational measures to
          protect the security of your personal information, including
          encryption in transit (TLS) and at rest. However, please be aware that
          no method of transmission over the Internet or method of electronic
          storage is 100% secure.
        </p>
        <p>
          In the event of a data breach that affects your personal data, we will
          notify you and the relevant supervisory authority within 72 hours of
          becoming aware of the breach, as required by applicable law.
        </p>
      </>
    ),
  },
  {
    title: 'Your Rights',
    content: (
      <>
        <p>
          Depending on your location (including under the GDPR for EEA
          residents), you may have the right to:
        </p>
        <ul>
          <li>Access and receive a copy of your personal data.</li>
          <li>Correct inaccurate personal data.</li>
          <li>Request deletion of your personal data.</li>
          <li>Restrict or object to the processing of your data.</li>
          <li>Data portability (receive your data in a structured format).</li>
          <li>
            Withdraw consent at any time where processing is based on consent.
          </li>
          <li>
            Lodge a complaint with a supervisory authority if you believe your
            rights have been violated.
          </li>
        </ul>
        <p>
          You can manage most of your data directly within your account
          settings. To exercise any other rights, contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
            {SUPPORT_EMAIL}
          </a>
          . We will respond to your request within 30 days.
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
        Our Service is not addressed to anyone under the age of 13 (or 16 in the
        EEA). We do not knowingly collect personal identifiable information from
        children under these ages. If we become aware that we have collected
        data from a child without parental consent, we will take steps to delete
        that information.
      </p>
    ),
  },
  {
    title: 'Changes to This Policy',
    content: (
      <p>
        We may update our Privacy Policy from time to time. We will notify you
        of any material changes by posting the new Privacy Policy on this page,
        updating the &quot;Last updated&quot; date, and, where practicable,
        sending you an email notification.
      </p>
    ),
  },
  {
    title: 'Contact Us',
    content: (
      <p>
        If you have any questions about this Privacy Policy, please contact us
        at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className='lead'>Last updated: {LEGAL_LAST_UPDATED}</p>

      <p>
        At Kytbox, we take your privacy seriously. This Privacy Policy explains
        how we collect, use, disclose, and safeguard your information when you
        visit our website or use our services (&quot;Service&quot;).
      </p>

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

import { Metadata } from 'next';
import {
  LEGAL_LAST_UPDATED,
  SUPPORT_EMAIL,
  LEGAL_ENTITY,
  toSectionId,
} from '../constants';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service and usage guidelines for Kytbox.',
  alternates: {
    canonical: '/terms',
  },
};

const SECTIONS = [
  {
    title: 'Introduction',
    content: (
      <p>
        Kytbox (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), operated by{' '}
        {LEGAL_ENTITY}, provides a suite of personal utility tools including Bio
        link pages, Cashflow planning, and other productivity applications
        (collectively, the &quot;Service&quot;).
      </p>
    ),
  },
  {
    title: 'Account Registration',
    content: (
      <>
        <p>
          You must be at least 13 years old (or 16 in the European Economic
          Area) to use this Service. By registering, you represent that you meet
          this age requirement.
        </p>
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
  /* {
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
  }, */
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
          non-exclusive, worldwide, royalty-free license to host, use, and
          display your content solely as necessary to provide the Service.
        </p>
      </>
    ),
  },
  {
    title: 'Disclaimer of Warranties',
    content: (
      <>
        <p>
          THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
          AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
          OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>
        <p>
          We do not warrant that the Service will be uninterrupted, error-free,
          or free of viruses or other harmful components. Your use of the
          Service is at your sole risk.
        </p>
      </>
    ),
  },
  {
    title: 'Limitation of Liability',
    content: (
      <>
        <p>
          In no event shall Kytbox, nor its operator, employees, partners,
          agents, suppliers, or affiliates, be liable for any indirect,
          incidental, special, consequential or punitive damages, including
          without limitation, loss of profits, data, use, goodwill, or other
          intangible losses, resulting from your access to or use of or
          inability to access or use the Service.
        </p>
        <p>
          Our total aggregate liability for any claim arising out of or relating
          to the Service shall not exceed the amount you paid us during the 12
          months preceding the claim, or $100 USD, whichever is greater.
        </p>
      </>
    ),
  },
  {
    title: 'Indemnification',
    content: (
      <p>
        You agree to indemnify, defend, and hold harmless Kytbox and its
        operator from and against any claims, liabilities, damages, losses,
        costs, or expenses (including reasonable legal fees) arising out of or
        related to your use of the Service, your violation of these Terms, or
        your violation of any rights of a third party.
      </p>
    ),
  },
  {
    title: 'Termination',
    content: (
      <>
        <p>
          We may terminate or suspend your account if you breach these Terms,
          with notice where practicable. Upon termination, your right to use the
          Service will immediately cease.
        </p>
        <p>
          You may request a copy of your data or deletion of your account at any
          time by contacting us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
            {SUPPORT_EMAIL}
          </a>
          . We will process your request within 30 days.
        </p>
      </>
    ),
  },
  {
    title: 'Dispute Resolution',
    content: (
      <>
        <p>
          If you have a dispute with us, we encourage you to first contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
            {SUPPORT_EMAIL}
          </a>{' '}
          to attempt to resolve the matter informally. We will endeavor to
          resolve your concern within 30 days.
        </p>
        <p>
          If informal resolution is unsuccessful, any dispute arising under
          these Terms shall be subject to the exclusive jurisdiction of the
          courts of Indonesia, governed by the laws of Indonesia without regard
          to its conflict of law provisions.
        </p>
        <p>
          Nothing in these Terms shall deprive you of any mandatory consumer
          protection rights under the laws of your country of residence,
          including the right to bring claims in your local courts where
          required by applicable law.
        </p>
      </>
    ),
  },
  {
    title: 'Changes to Terms',
    content: (
      <p>
        We reserve the right, at our sole discretion, to modify or replace these
        Terms at any time. If a revision is material, we will try to provide at
        least 30 days&apos; notice prior to any new terms taking effect, via
        email or prominent notice within the Service.
      </p>
    ),
  },
  {
    title: 'Contact Us',
    content: (
      <p>
        If you have any questions about these Terms, please contact us at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} aria-label='Email Kytbox support'>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className='lead'>Last updated: {LEGAL_LAST_UPDATED}</p>

      <p>
        Welcome to Kytbox. By accessing or using our website and services, you
        agree to be bound by these Terms of Service.
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

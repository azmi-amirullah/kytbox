import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy - Kytbox',
  description: 'Refund policy for Kytbox subscriptions and purchases.',
};

export default function RefundPage() {
  return (
    <>
      <h1>Refund Policy</h1>
      <p className='lead'>Last updated: February 10, 2026</p>

      <p>
        We want you to be satisfied with Kytbox. If you are not completely happy
        with the service, we offer a refund policy as outlined below.
      </p>

      <div className='bg-muted/50 p-4 rounded-lg my-6 border border-border/50 text-sm'>
        <strong>Note:</strong> All payments are securely processed by our
        Merchant of Record, <strong>Lemon Squeezy</strong>.
      </div>

      <h2>1. 14-Day Money-Back Guarantee</h2>
      <p>
        For new subscriptions (Pro plans), we offer a 14-day money-back
        guarantee. If you cancel your subscription within 14 days of your
        initial purchase, you can request a full refund.
      </p>

      <h2>2. How to Request a Refund</h2>
      <p>
        Since Lemon Squeezy handles the financial transaction, we can process
        refunds directly through their system. You do not need to contact them;
        simply contact us:
      </p>
      <ul>
        <li>
          Email us at <a href='mailto:support@kytbox.com'>support@kytbox.com</a>{' '}
          with your account email and date of purchase.
        </li>
        <li>We will trigger the refund via the Lemon Squeezy dashboard.</li>
      </ul>
      <p>
        Once triggered, the funds will be returned to your original payment
        method by Lemon Squeezy (typically within 5-10 business days, depending
        on your bank).
      </p>

      <h2>3. Exceptions</h2>
      <p>Refunds are not available for:</p>
      <ul>
        <li>
          Renewal charges if not cancelled prior to the renewal date (unless
          required by law).
        </li>
        <li>Purchases made more than 14 days ago.</li>
        <li>
          Accounts suspended or terminated for violation of our Terms of
          Service.
        </li>
      </ul>

      <h2>4. Cancellation</h2>
      <p>
        You can cancel your subscription at any time from your account settings.
        If you cancel after the 14-day refund window, your subscription will
        remain active until the end of the current billing period, and you will
        not be charged again.
      </p>

      <h2>5. Contact Us</h2>
      <p>
        If you have any questions about our Refund Policy, please contact us at{' '}
        <a href='mailto:support@kytbox.com'>support@kytbox.com</a>.
      </p>
    </>
  );
}

import { redirect } from 'next/navigation';

export default function BioMessagesPage() {
  redirect('/bio?tab=messages');
}

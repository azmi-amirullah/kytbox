import { redirect } from 'next/navigation';

export default function BioMessagePage() {
  redirect('/bio?tab=messages');
}

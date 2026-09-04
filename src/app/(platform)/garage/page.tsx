import type { Metadata } from 'next'
import { getVehicles, getUserCashflowBooks, GarageDashboard } from '@/features/garage'

export const metadata: Metadata = {
  title: 'Garage',
  description: 'Manage vehicles, track forward mileage, and schedule asset maintenance',
  robots: { index: false, follow: false },
}

export default async function GaragePage() {
  const [vehiclesRes, booksRes] = await Promise.all([
    getVehicles(true), // load both active and archived for tab switching
    getUserCashflowBooks(),
  ])

  return (
    <GarageDashboard
      vehicles={vehiclesRes.data || []}
      cashflowBooks={booksRes.data || []}
    />
  )
}

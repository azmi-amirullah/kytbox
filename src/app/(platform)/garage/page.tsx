import type { Metadata } from 'next'
import { after } from 'next/server'
import {
  getVehicles,
  getUserCashflowBooks,
  getDriverLicenses,
  GarageDashboard,
  checkAndEmitDocumentAlerts,
} from '@/features/garage'

export const metadata: Metadata = {
  title: 'Garage',
  description: 'Manage vehicles, track forward mileage, and schedule asset maintenance',
  robots: { index: false, follow: false },
}

export default async function GaragePage() {
  // Guaranteed serverless lifecycle execution via Next.js after()
  after(async () => {
    try {
      await checkAndEmitDocumentAlerts()
    } catch (err) {
      console.error('[Garage] Failed to check document alerts:', err)
    }
  })

  const [vehiclesRes, booksRes, licensesRes] = await Promise.all([
    getVehicles(true), // load both active and archived for tab switching
    getUserCashflowBooks(),
    getDriverLicenses(),
  ])

  return (
    <GarageDashboard
      vehicles={vehiclesRes.data || []}
      cashflowBooks={booksRes.data || []}
      driverLicenses={licensesRes.data || []}
    />
  )
}

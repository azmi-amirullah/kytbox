import type { Metadata } from 'next'
import { after } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import {
  getVehicleById,
  getUserCashflowBooks,
  VehicleDetail,
  checkAndEmitDocumentAlerts,
} from '@/features/garage'

const vehicleIdSchema = z.string().uuid()

interface VehicleDetailPageProps {
  params: Promise<{ vehicleId: string }>
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { vehicleId } = await params
  if (!vehicleIdSchema.safeParse(vehicleId).success) {
    return {
      title: 'Vehicle',
      robots: { index: false, follow: false },
    }
  }

  const res = await getVehicleById(vehicleId)
  const vehicleName = res.vehicle?.name || 'Vehicle'

  return {
    title: `${vehicleName} | Garage`,
    description: `Vehicle maintenance profile and odometer tracking for ${vehicleName}`,
    robots: { index: false, follow: false },
  }
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { vehicleId } = await params

  if (!vehicleIdSchema.safeParse(vehicleId).success) {
    notFound()
  }

  // Guaranteed serverless lifecycle execution via Next.js after()
  after(async () => {
    try {
      await checkAndEmitDocumentAlerts(vehicleId)
    } catch (err) {
      console.error('[Garage] Failed to check vehicle document alerts:', err)
    }
  })

  const [vehicleRes, booksRes] = await Promise.all([
    getVehicleById(vehicleId),
    getUserCashflowBooks(),
  ])

  if (!vehicleRes.success || !vehicleRes.vehicle) {
    redirect('/garage')
  }

  return (
    <VehicleDetail
      vehicle={vehicleRes.vehicle}
      monthlyOdometers={vehicleRes.monthlyOdometers || []}
      maintenanceRules={vehicleRes.maintenanceRules || []}
      services={vehicleRes.services || []}
      documents={vehicleRes.documents || []}
      cashflowBooks={booksRes.data || []}
    />
  )
}

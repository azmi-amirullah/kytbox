import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { getVehicleById, getUserCashflowBooks, VehicleDetail } from '@/features/garage'

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
      cashflowBooks={booksRes.data || []}
    />
  )
}

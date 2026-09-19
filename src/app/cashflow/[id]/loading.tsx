import { Loader } from '@/components/ui/loader'

export default function Loading() {
  return (
    <div className='flex items-center justify-center min-h-[50vh] py-16'>
      <Loader text='Loading cashflow...' />
    </div>
  )
}

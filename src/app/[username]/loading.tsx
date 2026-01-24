export default function Loading() {
  return (
    <div className='min-h-screen bg-background w-full'>
      <div className='w-full max-w-[680px] mx-auto px-6 py-16 md:py-24 flex flex-col items-center animate-pulse'>
        {/* Profile Header Skeleton */}
        <div className='text-center mb-12 w-full flex flex-col items-center'>
          {/* Avatar */}
          <div className='w-28 h-28 md:w-32 md:h-32 rounded-full bg-muted mb-6' />

          {/* Name */}
          <div className='h-8 w-48 bg-muted rounded-md mb-3' />

          {/* Bio */}
          <div className='h-5 w-64 bg-muted rounded-md mb-2' />
          <div className='h-5 w-40 bg-muted rounded-md' />
        </div>

        {/* Links Skeleton */}
        <div className='w-full space-y-4'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='w-full h-16 rounded-xl bg-muted border border-border/50'
            />
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className='mt-20 flex flex-col items-center gap-1 opacity-50'>
          <div className='h-3 w-32 bg-muted rounded-md' />
        </div>
      </div>
    </div>
  );
}

export function BrandLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-full ${
        fullScreen
          ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-md'
          : 'min-h-[60vh] py-12'
      }`}
    >
      <div className='relative flex items-center justify-center'>
        {/* Glow behind the spinner */}
        <div className='absolute w-24 h-24 rounded-full bg-primary/20 blur-xl animate-pulse' />

        {/* Spinner outer ring */}
        <div className='w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin' />

        {/* Center brand symbol */}
        <div className='absolute font-bold text-sm text-foreground tracking-wider animate-pulse'>
          KB
        </div>
      </div>

      <p className='mt-6 text-sm font-medium text-muted-foreground tracking-wide animate-pulse'>
        Loading...
      </p>
    </div>
  );
}

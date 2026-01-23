interface BackgroundBlobsProps {
  variant?: 'default' | 'subtle';
}

export function BackgroundBlobs({ variant = 'default' }: BackgroundBlobsProps) {
  const isSubtle = variant === 'subtle';

  return (
    <div className='fixed inset-0 z-0 pointer-events-none overflow-hidden'>
      <div
        className={`absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full blur-[100px] animate-blob ${
          isSubtle ? 'bg-primary/5' : 'bg-primary/10'
        }`}
      />
      <div
        className={`absolute top-[20%] right-[-10%] h-[500px] w-[500px] rounded-full blur-[100px] animate-blob animation-delay-2000 ${
          isSubtle ? 'bg-chart-2/5' : 'bg-chart-2/10'
        }`}
      />
      <div
        className={`absolute bottom-[-10%] left-[20%] h-[500px] w-[500px] rounded-full blur-[100px] animate-blob animation-delay-4000 ${
          isSubtle ? 'bg-chart-5/10' : 'bg-chart-5/15'
        }`}
      />
      <div className='absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[24px_24px] opacity-50' />
    </div>
  );
}

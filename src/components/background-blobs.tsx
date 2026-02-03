export function BackgroundBlobs() {
  return (
    <div className='fixed inset-0 -z-10 pointer-events-none overflow-hidden'>
      {/* Grid Pattern */}
      <div className='absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[24px_24px] opacity-50' />
    </div>
  );
}

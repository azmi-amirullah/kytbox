'use client';

import { motion } from 'framer-motion';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ─── Bio: Phone frame with animated link items ─────────────────────────── */
export function BioMockup() {
  return (
    <div className='relative mx-auto w-[220px] sm:w-[260px]'>
      {/* Phone frame */}
      <div className='rounded-4xl border-2 border-border/60 bg-card/80 backdrop-blur-xl p-4 pt-8 pb-6 shadow-2xl'>
        {/* Notch */}
        <div className='absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-border/40 rounded-full' />

        {/* Avatar */}
        <div className='w-12 h-12 rounded-full bg-primary/20 mx-auto mb-3' />
        <div className='w-20 h-2.5 bg-muted rounded-full mx-auto mb-1' />
        <div className='w-14 h-2 bg-muted/60 rounded-full mx-auto mb-5' />

        {/* Links */}
        <motion.div
          variants={stagger}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='space-y-2.5'
        >
          {[
            { color: 'bg-primary/15 border-primary/30', width: 'w-full' },
            { color: 'bg-blue-500/15 border-blue-500/30', width: 'w-full' },
            { color: 'bg-emerald-500/15 border-emerald-500/30', width: 'w-full' },
            { color: 'bg-purple-500/15 border-purple-500/30', width: 'w-full' },
          ].map((link, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={`${link.width} h-10 rounded-xl border ${link.color} flex items-center justify-center`}
            >
              <div className='w-16 h-2 bg-foreground/10 rounded-full' />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Cashflow: Dashboard card with mini chart ──────────────────────────── */
export function CashflowMockup() {
  const bars = [35, 55, 40, 70, 60, 80, 50];

  return (
    <div className='relative mx-auto w-full max-w-[320px]'>
      <div className='rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-5 shadow-2xl'>
        {/* Balance header */}
        <div className='mb-5'>
          <div className='w-14 h-2 bg-muted/60 rounded-full mb-2' />
          <div className='flex items-baseline gap-1'>
            <span className='text-2xl font-bold text-foreground'>$4,280</span>
            <span className='text-xs text-emerald-500 font-medium'>+12.5%</span>
          </div>
        </div>

        {/* Mini stat row */}
        <div className='grid grid-cols-2 gap-3 mb-5'>
          <div className='rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5'>
            <div className='text-[10px] text-muted-foreground mb-0.5'>Income</div>
            <div className='text-sm font-semibold text-emerald-600'>+$6,200</div>
          </div>
          <div className='rounded-lg bg-red-500/10 border border-red-500/20 p-2.5'>
            <div className='text-[10px] text-muted-foreground mb-0.5'>Expense</div>
            <div className='text-sm font-semibold text-red-500'>-$1,920</div>
          </div>
        </div>

        {/* Bar chart */}
        <motion.div
          variants={stagger}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='flex items-end gap-1.5 h-16'
        >
          {bars.map((h, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { height: 0, opacity: 0 },
                visible: {
                  height: `${h}%`,
                  opacity: 1,
                  transition: { duration: 0.5, delay: i * 0.06 },
                },
              }}
              className='flex-1 rounded-t-sm bg-primary/30'
            />
          ))}
        </motion.div>
        <div className='flex justify-between mt-1.5'>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className='text-[9px] text-muted-foreground/50 flex-1 text-center'>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── List: Mini Kanban board ───────────────────────────────────────────── */
export function ListMockup() {
  const columns = [
    { title: 'To Do', items: 3, color: 'bg-blue-500/20 border-blue-500/30' },
    { title: 'In Progress', items: 2, color: 'bg-amber-500/20 border-amber-500/30' },
    { title: 'Done', items: 4, color: 'bg-emerald-500/20 border-emerald-500/30' },
  ];

  return (
    <div className='relative mx-auto w-full max-w-[360px]'>
      <div className='rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 shadow-2xl'>
        {/* Board header */}
        <div className='flex items-center gap-2 mb-4'>
          <div className='w-3 h-3 rounded bg-primary/30' />
          <div className='w-20 h-2.5 bg-muted rounded-full' />
        </div>

        {/* Columns */}
        <motion.div
          variants={stagger}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true }}
          className='grid grid-cols-3 gap-2'
        >
          {columns.map((col) => (
            <motion.div key={col.title} variants={fadeUp} className='space-y-1.5'>
              <div className='flex items-center gap-1 mb-2'>
                <div className='text-[10px] font-semibold text-muted-foreground truncate'>
                  {col.title}
                </div>
                <span className='text-[9px] text-muted-foreground/50'>{col.items}</span>
              </div>
              {Array.from({ length: col.items }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-md border ${col.color} p-2`}
                >
                  <div className='w-full h-1.5 bg-foreground/8 rounded-full mb-1' />
                  <div className='w-3/5 h-1.5 bg-foreground/5 rounded-full' />
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

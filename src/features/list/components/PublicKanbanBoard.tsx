'use client'

import { useState } from 'react'
import type { ListColumnDTO, ListItemDTO } from '@/types/dto'
import {
  FiCheckCircle,
  FiCircle,
  FiCalendar,
  FiCheckSquare,
  FiLink,
  FiSearch,
} from 'react-icons/fi'

interface PublicKanbanBoardProps {
  columns: ListColumnDTO[]
  items: ListItemDTO[]
}

export function PublicKanbanBoard({ columns, items }: PublicKanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Map items to columns
  const columnItemsMap = new Map<string, ListItemDTO[]>()
  for (const col of columns) {
    columnItemsMap.set(col.id, [])
  }

  // Fallback for unassigned items
  const unassignedItems: ListItemDTO[] = []

  for (const item of items) {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = item.title.toLowerCase().includes(q)
      const descMatch = item.description?.toLowerCase().includes(q)
      if (!titleMatch && !descMatch) continue
    }

    if (item.column_id && columnItemsMap.has(item.column_id)) {
      columnItemsMap.get(item.column_id)?.push(item)
    } else {
      unassignedItems.push(item)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Search Header */}
      <div className='flex items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/60'>
        <span className='text-xs sm:text-sm font-semibold text-muted-foreground'>
          {items.length} {items.length === 1 ? 'task' : 'tasks'} across{' '}
          {columns.length} columns
        </span>

        <div className='relative w-full max-w-xs'>
          <FiSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search board cards...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary'
          />
        </div>
      </div>

      {/* Board Columns Grid */}
      <div className='flex gap-4 overflow-x-auto pb-6 items-start snap-x'>
        {columns.map((column) => {
          const colItems = columnItemsMap.get(column.id) || []

          return (
            <div
              key={column.id}
              className='w-72 sm:w-80 shrink-0 bg-muted/40 border border-border/70 rounded-2xl p-4 flex flex-col gap-3 snap-start'
            >
              {/* Column Header */}
              <div className='flex items-center justify-between pb-2 border-b border-border/40'>
                <h3 className='font-bold text-sm text-foreground flex items-center gap-2'>
                  {column.is_done_column ? (
                    <FiCheckCircle className='w-4 h-4 text-emerald-500' />
                  ) : (
                    <FiCircle className='w-4 h-4 text-muted-foreground' />
                  )}
                  <span>{column.title}</span>
                </h3>
                <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground'>
                  {colItems.length}
                </span>
              </div>

              {/* Column Items */}
              <div className='space-y-3 min-h-25'>
                {colItems.length === 0 ? (
                  <div className='p-6 text-center text-xs text-muted-foreground/60 rounded-xl border border-dashed border-border/50'>
                    No cards in this column
                  </div>
                ) : (
                  colItems.map((item) => (
                    <div
                      key={item.id}
                      className='p-4 rounded-xl bg-card border border-border/80 shadow-2xs space-y-2.5'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <h4
                          className={`font-semibold text-sm text-foreground leading-snug ${
                            item.is_completed
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {item.title}
                        </h4>

                        {item.priority && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                              item.priority === 'urgent'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : item.priority === 'high'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {item.priority}
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className='text-xs text-muted-foreground line-clamp-3 leading-relaxed'>
                          {item.description}
                        </p>
                      )}

                      {/* Card Metadata (Subtasks, Due Date, Links) */}
                      <div className='flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground font-medium'>
                        {item.due_date && (
                          <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border/60'>
                            <FiCalendar className='w-3 h-3' />
                            <span>{item.due_date}</span>
                          </span>
                        )}

                        {item.subtasks && item.subtasks.length > 0 && (
                          <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border/60'>
                            <FiCheckSquare className='w-3 h-3' />
                            <span>
                              {
                                item.subtasks.filter((s) => s.is_completed)
                                  .length
                              }
                              /{item.subtasks.length}
                            </span>
                          </span>
                        )}

                        {item.resources && item.resources.length > 0 && (
                          <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border/60'>
                            <FiLink className='w-3 h-3' />
                            <span>{item.resources.length}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

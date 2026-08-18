'use client'

import { useState, useRef, useEffect, useMemo, useId, type KeyboardEvent } from 'react'
import { LuX, LuTag, LuPlus, LuCheck } from 'react-icons/lu'
import { cn } from '@/lib/utils'

import type { CashflowTagDTO } from '@/types/dto'
export {
  TAG_COLORS,
  getNextAvailableColorIndex,
  getTagColorIndex,
  resolveTagColor,
  getTagColor,
  getBookTagColor,
} from '../lib/tag-colors'
import {
  TAG_COLORS,
  getNextAvailableColorIndex,
  resolveTagColor,
} from '../lib/tag-colors'

export interface TagBadgeProps {
  tag: string
  color?: { bg: string; text: string; border: string }
  bookTags?: CashflowTagDTO[]
  onRemove?: () => void
  disabled?: boolean
  className?: string
}

/**
 * Single, unified Tag Badge component.
 * Exact same geometry and text size as category/recurring badges.
 */
export function TagBadge({
  tag,
  color: customColor,
  bookTags,
  onRemove,
  disabled = false,
  className,
}: TagBadgeProps) {
  const color = customColor || resolveTagColor(tag, bookTags)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 h-5 px-1.5 rounded text-[10px] font-medium border leading-none transition-colors select-none shrink-0',
        color.bg,
        color.text,
        color.border,
        className,
      )}
    >
      #{tag}
      {onRemove && !disabled && (
        <span
          role='button'
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRemove()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }
          }}
          aria-label={`Remove tag ${tag}`}
          className='hover:opacity-70 focus-visible:outline-none rounded-xs cursor-pointer -mr-0.5 inline-flex items-center justify-center'
        >
          <LuX className='w-2.5 h-2.5' />
        </span>
      )}
    </span>
  )
}

/**
 * Read-only tag badge list — used in table rows and cards.
 */
export function TagBadges({
  tags,
  bookTags,
  className,
}: {
  tags: string[]
  bookTags?: CashflowTagDTO[]
  availableTags?: string[]
  className?: string
}) {
  if (!tags || tags.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {tags.map((tag) => (
        <TagBadge key={tag} tag={tag} bookTags={bookTags} />
      ))}
    </div>
  )
}

export interface TagPickerProps {
  tags?: string[]
  onChange: (tags: string[]) => void
  availableTags?: string[]
  bookTags?: CashflowTagDTO[]
  maxTags?: number
  placeholder?: string
  disabled?: boolean
  className?: string
}

interface SuggestionItem {
  type: 'create' | 'existing' | 'already-selected'
  value: string
}

/**
 * Multi-tag input with inline Combobox autocomplete.
 */
export function TagPicker({
  tags = [],
  onChange,
  availableTags = [],
  bookTags = [],
  maxTags = 10,
  placeholder = 'Add tags...',
  disabled = false,
  className,
}: TagPickerProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const trimmedInput = inputValue.trim().replace(/^#/, '')

  // Effective available tag names (from availableTags or bookTags)
  const allAvailableNames = useMemo(() => {
    const set = new Set<string>()
    for (const t of availableTags) set.add(t)
    for (const bt of bookTags) set.add(bt.name)
    return Array.from(set)
  }, [availableTags, bookTags])

  // Exclude tags already selected
  const unselectedAvailable = allAvailableNames.filter(
    (avail) => !tags.some((t) => t.toLowerCase() === avail.toLowerCase()),
  )

  // Matching existing tags based on input search
  const matchingExisting = unselectedAvailable.filter((avail) =>
    avail.toLowerCase().includes(trimmedInput.toLowerCase()),
  )

  // Matching tags already selected
  const matchingSelected = tags.filter(
    (t) =>
      trimmedInput.length > 0 &&
      t.toLowerCase().includes(trimmedInput.toLowerCase()),
  )

  // Check if input is non-empty, not already selected, and not in existing matches (exact match)
  const exactMatchExists = allAvailableNames.some(
    (t) => t.toLowerCase() === trimmedInput.toLowerCase(),
  )
  const isAlreadySelected = tags.some(
    (t) => t.toLowerCase() === trimmedInput.toLowerCase(),
  )
  const canCreate =
    trimmedInput.length > 0 &&
    trimmedInput.length <= 30 &&
    !isAlreadySelected &&
    !exactMatchExists &&
    tags.length < maxTags

  // Build suggestion list
  const suggestions: SuggestionItem[] = []
  if (canCreate) {
    suggestions.push({ type: 'create', value: trimmedInput })
  }
  for (const match of matchingExisting) {
    suggestions.push({ type: 'existing', value: match })
  }
  for (const match of matchingSelected) {
    suggestions.push({ type: 'already-selected', value: match })
  }

  // Pre-calculate colors for selected tags
  const tagColorMap = useMemo(() => {
    const map = new Map<string, { bg: string; text: string; border: string }>()
    const simulatedTags: Array<{ color_index: number }> = [...bookTags]

    for (const tag of tags) {
      const match = bookTags.find(
        (t) => t.name.toLowerCase() === tag.toLowerCase(),
      )
      if (match && typeof match.color_index === 'number') {
        map.set(tag, TAG_COLORS[match.color_index % TAG_COLORS.length])
      } else {
        const nextIdx = getNextAvailableColorIndex(simulatedTags)
        simulatedTags.push({ color_index: nextIdx })
        map.set(tag, TAG_COLORS[nextIdx])
      }
    }
    return map
  }, [tags, bookTags])

  // Predict the exact assigned color for the next created tag
  const nextColorForNewTag = useMemo(() => {
    const simulatedTags: Array<{ color_index: number }> = [...bookTags]
    for (const tag of tags) {
      const match = bookTags.find(
        (t) => t.name.toLowerCase() === tag.toLowerCase(),
      )
      if (!match) {
        const nextIdx = getNextAvailableColorIndex(simulatedTags)
        simulatedTags.push({ color_index: nextIdx })
      }
    }
    const nextIdx = getNextAvailableColorIndex(simulatedTags)
    return TAG_COLORS[nextIdx]
  }, [tags, bookTags])

  // Close dropdown on click outside without type assertions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function addTag(raw: string, shouldFocus = false) {
    const clean = raw.trim().replace(/^#/, '')
    if (!clean || clean.length > 30) return
    if (tags.length >= maxTags) return

    // Auto-match casing from existing available tags
    const existingCase = allAvailableNames.find(
      (t) => t.toLowerCase() === clean.toLowerCase(),
    )
    const tagToUse = existingCase || clean

    const exists = tags.some((t) => t.toLowerCase() === tagToUse.toLowerCase())
    if (exists) {
      setInputValue('')
      setActiveIndex(0)
      return
    }
    onChange([...tags, tagToUse])
    setInputValue('')
    setActiveIndex(0)
    if (shouldFocus) {
      inputRef.current?.focus()
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index))
  }

  function handleSelectSuggestion(item: SuggestionItem) {
    if (item.type === 'already-selected') {
      setInputValue('')
      setActiveIndex(0)
      return
    }
    addTag(item.value, true)
    if (tags.length + 1 >= maxTags) {
      setIsOpen(false)
    }
  }

  function handleBlur() {
    if (trimmedInput) {
      addTag(trimmedInput, false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else if (suggestions.length > 0) {
        setActiveIndex((prev) => (prev + 1) % suggestions.length)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else if (suggestions.length > 0) {
        setActiveIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        )
      }
      return
    }

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (
        isOpen &&
        suggestions.length > 0 &&
        activeIndex >= 0 &&
        activeIndex < suggestions.length
      ) {
        handleSelectSuggestion(suggestions[activeIndex])
      } else if (trimmedInput) {
        addTag(trimmedInput, true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      return
    }

    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  const showDropdown = isOpen && suggestions.length > 0 && !disabled

  return (
    <div ref={containerRef} className='relative w-full'>
      <label
        className={cn(
          'flex flex-wrap items-center gap-1.5 min-h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm font-medium text-foreground shadow-xs transition-colors cursor-text',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          className,
        )}
      >
        <LuTag className='w-3.5 h-3.5 text-muted-foreground shrink-0' />

        {tags.map((tag, i) => (
          <TagBadge
            key={tag}
            tag={tag}
            color={tagColorMap.get(tag)}
            bookTags={bookTags}
            disabled={disabled}
            onRemove={() => removeTag(i)}
          />
        ))}

        {tags.length < maxTags && !disabled && (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setActiveIndex(0)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => {
              setActiveIndex(0)
              setIsOpen(true)
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className='flex-1 min-w-20 border-0 border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none ring-0 outline-none focus:border-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/70'
            aria-label='Add tag'
            aria-autocomplete='list'
            aria-controls={showDropdown ? listboxId : undefined}
            aria-expanded={showDropdown}
            role='combobox'
          />
        )}
      </label>

      {showDropdown && (
        <div
          id={listboxId}
          role='listbox'
          className='absolute z-50 top-full left-0 mt-1.5 w-full max-h-52 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1 animate-in fade-in-0 zoom-in-95 duration-100'
        >
          {suggestions.map((item, index) => {
            const isSelected = activeIndex === index

            if (item.type === 'create') {
              return (
                <button
                  key={`create-${item.value}`}
                  type='button'
                  role='option'
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelectSuggestion(item)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-medium text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-foreground/90',
                  )}
                >
                  <span className='flex items-center gap-1.5'>
                    <LuPlus className='w-3.5 h-3.5 text-primary shrink-0' />
                    <span>Create new tag:</span>
                    <TagBadge tag={item.value} color={nextColorForNewTag} />
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    Press Enter
                  </span>
                </button>
              )
            }

            if (item.type === 'already-selected') {
              return (
                <div
                  key={`selected-${item.value}`}
                  className='w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-medium text-left opacity-75 bg-muted/40'
                >
                  <TagBadge tag={item.value} bookTags={bookTags} />
                  <LuCheck className='w-3.5 h-3.5 text-muted-foreground' />
                </div>
              )
            }

            return (
              <button
                key={`existing-${item.value}`}
                type='button'
                role='option'
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelectSuggestion(item)
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'w-full flex items-center px-2.5 py-1.5 rounded-sm text-xs font-medium text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-foreground/90',
                )}
              >
                <TagBadge tag={item.value} bookTags={bookTags} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

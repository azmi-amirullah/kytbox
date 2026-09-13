/** @vitest-environment jsdom */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from '@/components/ui/date-picker'
import { getTodayDateOnlyString } from '@/lib/date-only'

describe('DatePicker Component', () => {
  it('renders with placeholder and triggers popover', () => {
    render(<DatePicker placeholder='Select date' />)

    const trigger = screen.getByRole('button', { name: /select date/i })
    expect(trigger).toBeDefined()

    // Open popover
    fireEvent.click(trigger)
    expect(screen.getByRole('button', { name: /^select today$/i })).toBeDefined()
  })

  it('selects today and calls onChange with local YYYY-MM-DD format', () => {
    const handleChange = vi.fn()
    render(<DatePicker onChange={handleChange} />)

    // Open popover
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    // Click Today button
    const todayBtn = screen.getByRole('button', { name: /^select today$/i })
    fireEvent.click(todayBtn)

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(getTodayDateOnlyString())
  })

  it('renders Clear button when date is selected and showClear is true', () => {
    const handleChange = vi.fn()
    render(<DatePicker value='2026-05-15' onChange={handleChange} showClear={true} />)

    // Open popover
    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    const clearBtn = screen.getByRole('button', { name: /^clear date$/i })
    expect(clearBtn).toBeDefined()

    fireEvent.click(clearBtn)
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('respects showToday=false prop', () => {
    render(<DatePicker showToday={false} />)

    const trigger = screen.getByRole('button')
    fireEvent.click(trigger)

    expect(screen.queryByRole('button', { name: /^select today$/i })).toBeNull()
  })
})

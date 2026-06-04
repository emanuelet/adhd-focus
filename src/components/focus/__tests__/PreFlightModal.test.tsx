// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreFlightModal } from '../PreFlightModal'

function setup(overrides: Partial<{ onContinue: () => void; onSkip: () => void; onClose: () => void }> = {}) {
  const onContinue = overrides.onContinue ?? vi.fn()
  const onSkip = overrides.onSkip ?? vi.fn()
  const onClose = overrides.onClose ?? vi.fn()
  const result = render(
    <PreFlightModal onContinue={onContinue} onSkip={onSkip} onClose={onClose} />,
  )
  return { onContinue, onSkip, onClose, result }
}

describe('PreFlightModal', () => {
  it('renders all 4 checklist items', () => {
    setup()
    expect(screen.getByText(/Phone face-down/)).toBeDefined()
    expect(screen.getByText(/Distracting sites blocked/)).toBeDefined()
    expect(screen.getByText(/Water/)).toBeDefined()
    expect(screen.getByText(/Work ritual started/)).toBeDefined()
  })

  it('renders title and subtitle', () => {
    setup()
    expect(screen.getByText('Pre-flight check')).toBeDefined()
    expect(screen.getByText('Set yourself up for a focused sprint.')).toBeDefined()
  })

  it('renders Start sprint and Skip ritual buttons', () => {
    setup()
    expect(screen.getByText('Start sprint →')).toBeDefined()
    expect(screen.getByText('Skip ritual')).toBeDefined()
  })

  it('disables Start sprint when nothing is checked', () => {
    setup()
    const btn = screen.getByText('Start sprint →') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('enables Start sprint when all items are checked', () => {
    setup()
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(4)
    for (const cb of checkboxes) {
      fireEvent.click(cb)
    }
    const btn = screen.getByText('Start sprint →') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('calls onContinue when Start sprint clicked with all checked', () => {
    const onContinue = vi.fn()
    setup({ onContinue })
    for (const cb of screen.getAllByRole('checkbox')) {
      fireEvent.click(cb)
    }
    fireEvent.click(screen.getByText('Start sprint →'))
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('does not call onContinue when not all items checked', () => {
    const onContinue = vi.fn()
    setup({ onContinue })
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    fireEvent.click(screen.getByText('Start sprint →'))
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('calls onSkip when Skip ritual is clicked', () => {
    const onSkip = vi.fn()
    setup({ onSkip })
    fireEvent.click(screen.getByText('Skip ritual'))
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    setup({ onClose })
    const backdrops = screen.getByRole('presentation')
    fireEvent.click(backdrops)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn()
    setup({ onClose })
    const heading = screen.getByText('Pre-flight check')
    fireEvent.click(heading)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('toggles checkbox state on click', () => {
    setup()
    const cb = screen.getAllByRole('checkbox')[0]
    expect((cb as HTMLInputElement).checked).toBe(false)
    fireEvent.click(cb)
    expect((cb as HTMLInputElement).checked).toBe(true)
    fireEvent.click(cb)
    expect((cb as HTMLInputElement).checked).toBe(false)
  })
})

// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SprintPicker } from '../SprintPicker'

function setup(overrides: Partial<{ onSelect: (l: number) => void; onClose: () => void }> = {}) {
  const onSelect = overrides.onSelect ?? vi.fn()
  const onClose = overrides.onClose ?? vi.fn()
  const result = render(<SprintPicker onSelect={onSelect} onClose={onClose} />)
  return { onSelect, onClose, result }
}

describe('SprintPicker', () => {
  it('renders all 4 duration options', () => {
    setup()
    expect(screen.getByText('25 min')).toBeDefined()
    expect(screen.getByText('52 min')).toBeDefined()
    expect(screen.getByText('90 min')).toBeDefined()
    expect(screen.getByText('2 hr')).toBeDefined()
  })

  it('renders title and subtitle', () => {
    setup()
    expect(screen.getByText('Sprint duration')).toBeDefined()
    expect(screen.getByText('How long will you focus?')).toBeDefined()
  })

  it('renders Focus → and Cancel buttons', () => {
    setup()
    expect(screen.getByText('Focus →')).toBeDefined()
    expect(screen.getByText('Cancel')).toBeDefined()
  })

  it('defaults to 52 min selected', () => {
    setup()
    const btn52 = screen.getByText('52 min')
    expect(btn52.className).toContain('accent')
  })

  it('changes selection when different option clicked', () => {
    setup()
    const btn25 = screen.getByText('25 min')
    fireEvent.click(btn25)
    expect(btn25.className).toContain('accent')
    const btn52 = screen.getByText('52 min')
    expect(btn52.className).not.toContain('accent')
  })

  it('calls onSelect with selected length when Focus clicked', () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    fireEvent.click(screen.getByText('Focus →'))
    expect(onSelect).toHaveBeenCalledWith(52)
  })

  it('calls onSelect with changed selection', () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    fireEvent.click(screen.getByText('90 min'))
    fireEvent.click(screen.getByText('Focus →'))
    expect(onSelect).toHaveBeenCalledWith(90)
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    setup({ onClose })
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    setup({ onClose })
    const backdrops = screen.getAllByRole('presentation')
    fireEvent.click(backdrops[0])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('selects each duration option and verifies Focus passes correct value', () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    const cases: [string, number][] = [
      ['25 min', 25],
      ['52 min', 52],
      ['90 min', 90],
      ['2 hr', 120],
    ]
    for (const [label, expected] of cases) {
      fireEvent.click(screen.getByText(label))
      fireEvent.click(screen.getByText('Focus →'))
      expect(onSelect).toHaveBeenLastCalledWith(expected)
    }
  })
})

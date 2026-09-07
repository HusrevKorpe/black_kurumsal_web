import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { FeaturesInput } from './features-input'

function Harness({ initial = [] as string[], max }: { initial?: string[]; max?: number }) {
  const [value, setValue] = useState<string[]>(initial)
  return (
    <>
      <FeaturesInput id="features" value={value} onChange={setValue} max={max} />
      <output data-testid="value">{value.join('|')}</output>
    </>
  )
}

describe('FeaturesInput', () => {
  it('Enter ile ekler, virgül ile ekler, çift kaydı reddeder', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'PS5{Enter}')
    await user.type(input, 'WiFi,')
    await user.type(input, 'ps5{Enter}')
    expect(screen.getByTestId('value')).toHaveTextContent('PS5|WiFi')
    expect(input).toHaveValue('')
  })

  it('çarpı ile siler ve Backspace boşken sonuncuyu kaldırır', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['PS5', 'WiFi']} />)
    await user.click(screen.getByRole('button', { name: 'PS5 özelliğini kaldır' }))
    expect(screen.getByTestId('value')).toHaveTextContent('WiFi')
    await user.type(screen.getByRole('textbox'), '{Backspace}')
    expect(screen.getByTestId('value')).toHaveTextContent('')
  })

  it('üst sınıra ulaşınca girişi kapatır', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['A']} max={2} />)
    await user.type(screen.getByRole('textbox'), 'B{Enter}')
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

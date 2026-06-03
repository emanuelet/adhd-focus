const COLOR_MAP: Record<string, string> = {
  berry_red:     '#b8256f',
  red:           '#dc4c3e',
  orange:        '#f29938',
  yellow:        '#e9a73a',
  olive_green:   '#98c978',
  lime_green:    '#89d13b',
  green:         '#33a856',
  mint_green:    '#5bbc7a',
  teal:          '#2c9e9e',
  sky_blue:      '#4ba0e3',
  light_blue:    '#76b5e8',
  blue:          '#4272b3',
  grape:         '#864fa3',
  violet:        '#9b6bcc',
  lavender:      '#b085c7',
  magenta:       '#c04f7d',
  salmon:        '#e48b8b',
  charcoal:      '#7a7a7a',
  grey:          '#949494',
  taupe:         '#99877b',
}

export function resolveColor(color: string): string {
  return COLOR_MAP[color] || color
}

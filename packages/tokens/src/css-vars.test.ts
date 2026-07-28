import { colors } from './colors';
import { cssVariables } from './css-vars';

describe('cssVariables', () => {
  it('emits a :root block that includes Gametime brand colors from gametime.co', () => {
    expect(cssVariables).toContain(':root');
    expect(cssVariables).toContain(`--color-accent: ${colors.accent}`);
    expect(cssVariables).toContain('--color-accent: #19CE85');
    expect(cssVariables).toContain(`--color-primary: ${colors.primary}`);
    expect(cssVariables).toContain(`--color-muted: ${colors.muted}`);
    expect(cssVariables).toContain(`--color-canvas: ${colors.canvas}`);
    expect(cssVariables).toContain(`--color-cta: ${colors.cta}`);
    expect(cssVariables).toContain(`--color-text: ${colors.text}`);
  });
});

import { colors } from './colors';
import { cssVariables } from './css-vars';

describe('cssVariables', () => {
  it('emits a :root block that includes the primary color', () => {
    expect(cssVariables).toContain(':root');
    expect(cssVariables).toContain(`--color-primary: ${colors.primary}`);
    expect(cssVariables).toContain(`--color-muted: ${colors.muted}`);
  });
});

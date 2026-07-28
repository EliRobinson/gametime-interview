/* eslint-disable @typescript-eslint/no-require-imports -- assert CJS preset matches TS colors */
import { colors } from './colors';

const preset = require('./preset.js') as {
  theme: { extend: { colors: { accent: { DEFAULT: string }; cta: string; ink: string } } };
};

describe('token single-source', () => {
  it('preset accent/cta/ink match colors.ts (palette.js)', () => {
    expect(preset.theme.extend.colors.accent.DEFAULT).toBe(colors.accent);
    expect(preset.theme.extend.colors.cta).toBe(colors.cta);
    expect(preset.theme.extend.colors.ink).toBe(colors.text);
  });

  it('primary aliases track accent', () => {
    expect(colors.primary).toBe(colors.accent);
    expect(colors.primaryLight).toBe(colors.accentLight);
    expect(colors.primaryDark).toBe(colors.accentDark);
  });
});

import { stadiumMapImageSrcSet, stadiumMapImageUrl } from './stadiumMapImage.util';

describe('stadiumMapImageUrl', () => {
  test.each([
    {
      width: 480,
      expected:
        'https://maps.gametime.co/v2/centurylink_field/edsheeran/edsheeran-8.png?width=480&auto=webp',
    },
    {
      width: 1280,
      expected:
        'https://maps.gametime.co/v2/centurylink_field/edsheeran/edsheeran-8.png?width=1280&auto=webp',
    },
  ])('builds a CDN url for width $width', ({ width, expected }) => {
    expect(stadiumMapImageUrl(width)).toBe(expected);
  });
});

describe('stadiumMapImageSrcSet', () => {
  it('exposes a default src and width descriptors for responsive loading', () => {
    const { src, srcSet } = stadiumMapImageSrcSet();

    expect(src).toContain('width=768');
    expect(srcSet).toContain('480w');
    expect(srcSet).toContain('768w');
    expect(srcSet).toContain('1280w');
  });
});

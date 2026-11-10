import { describe, expectTypeOf, it } from 'vitest';
import type { ElevationName, FontName, RadiusName, ShadowName, SizeName } from '../src/tokens';

describe('theme names', () => {
  it('the name types', () => {
    expectTypeOf<FontName>().toEqualTypeOf<'sans' | 'mono' | 'display' | 'body'>();
    expectTypeOf<'dialog'>().toExtend<RadiusName>();
    expectTypeOf<'controlSm'>().toExtend<SizeName>();
    expectTypeOf<ElevationName>().toEqualTypeOf<1 | 2 | 3>();
    expectTypeOf<ShadowName>().toEqualTypeOf<
      | 'soft'
      | 'chip'
      | 'raised'
      | 'dialog'
      | 'drawer'
      | 'sheet'
      | 'tabBar'
      | 'action'
      | 'actionInverse'
      | 'segmented'
    >();
    // @ts-expect-error a dark shadow set missing a key does not compile
    const _brokenDarkShadow = { soft: 'x' } as const satisfies Record<ShadowName, string>;
  });
});

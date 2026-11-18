import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../test/axe';

// `test/axe.ts` asks axe for violations only, to skip serialising every passing node. These pin
// that narrowing from the other side: it must never hide a violation, or every `toHaveNoViolations`
// in this app would go green for the wrong reason.
describe('the axe helper', () => {
  it('reports a violation, naming the rule and the node', async () => {
    const { container } = render(
      <main>
        <h1>Fine</h1>
        <div role="img" />
      </main>,
    );
    const results = await axe(container);
    expect(results).not.toHaveNoViolations();
    expect(results.violations.map((violation) => violation.id)).toContain('role-img-alt');
    expect(results.violations[0]?.nodes[0]?.html).toContain('role="img"');
  });

  it('reports nothing for markup with no violation', async () => {
    const { container } = render(
      <main>
        <h1>Fine</h1>
        <p>All of it labelled and ordered.</p>
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

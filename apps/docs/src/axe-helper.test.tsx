import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '../test/axe';

// `test/axe.ts` asks axe for violations only, to skip serialising every passing node. These pin
// that narrowing from the other side: a violation must still be reported, with every node that
// breaks the rule. (Result types left out of `resultTypes` are not dropped, they are cut to one
// node per rule, so a violation could never vanish, but a failure would name only its first node.)
describe('the axe helper', () => {
  it('reports a violation, naming the rule and the node', async () => {
    const { container } = render(
      <main>
        <h1>Fine</h1>
        <div role="img" />
        <div role="img" />
      </main>,
    );
    const results = await axe(container);
    expect(results).not.toHaveNoViolations();
    const violation = results.violations.find((entry) => entry.id === 'role-img-alt');
    expect(violation?.nodes).toHaveLength(2);
    expect(violation?.nodes[0]?.html).toContain('role="img"');
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

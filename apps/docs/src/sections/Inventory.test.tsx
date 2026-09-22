import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '../../test/axe';
import { Inventory } from './Inventory';

const index = {
  // eslint-disable-next-line id-length -- Storybook's index schema names its version field "v"
  v: 5,
  entries: {
    'overlays-dialog--center': {
      type: 'story',
      id: 'overlays-dialog--center',
      name: 'Center',
      title: 'Overlays/Dialog',
      importPath: './src/components/Dialog/Dialog.stories.tsx',
    },
    'primitives-alert--info': {
      type: 'story',
      id: 'primitives-alert--info',
      name: 'Info',
      title: 'Primitives/Alert',
      importPath: './src/components/Alert/Alert.stories.tsx',
    },
  },
};

function stubFetch(response: Response) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(response.clone())),
  );
}

/** The two answers this component has to render: the index Storybook builds, and no index. */
function stubIndexFound() {
  stubFetch(new Response(JSON.stringify(index), { status: 200 }));
}

function stubIndexMissing() {
  stubFetch(new Response('', { status: 404 }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Inventory', () => {
  it('reads the index same-origin and reports what the library actually ships', async () => {
    stubIndexFound();
    render(<Inventory />);
    expect(await screen.findByText('2 story groups')).toBeVisible();
    expect(screen.getByRole('link', { name: /Dialog/ })).toHaveAttribute(
      'href',
      '/storybook/?path=/story/overlays-dialog--center',
    );
    expect(fetch).toHaveBeenCalledWith('/storybook/index.json', expect.anything());
  });

  it('says what it tried to fetch when the index is not there, instead of rendering nothing', async () => {
    stubIndexMissing();
    render(<Inventory />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('/storybook/index.json');
    expect(alert).toHaveTextContent('404');
    // NODE_ENV is 'test' here, which is the branch a contributor sees: the remedy is shown. It
    // is gated out of a production build, where the command means nothing to a visitor.
    expect(alert).toHaveTextContent('bun run storybook');
  });

  it('shows a placeholder while the request is in flight', async () => {
    stubIndexFound();
    render(<Inventory />);
    expect(screen.getByTestId('skeleton')).toBeVisible();
    // Let the request settle before the test ends, so the state update it causes lands inside
    // React's act() rather than after the test has returned.
    expect(await screen.findByText('2 story groups')).toBeVisible();
  });

  it('has no axe violations once the table is loaded', async () => {
    stubIndexFound();
    const { container } = render(<Inventory />);
    expect(await screen.findByText('2 story groups')).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in the failure state', async () => {
    stubIndexMissing();
    const { container } = render(<Inventory />);
    await screen.findByRole('alert');
    expect(await axe(container)).toHaveNoViolations();
  });
});

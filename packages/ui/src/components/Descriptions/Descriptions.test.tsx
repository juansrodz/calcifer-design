import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Descriptions } from './Descriptions';
import * as stories from './Descriptions.stories';

const { Default, OneColumn, ThreeColumns, WithHeading, HeadingLevelTwo, CustomEmptyText, Dark } =
  composeStories(stories);

describe('Descriptions', () => {
  it.each([
    ['Default', Default],
    ['OneColumn', OneColumn],
    ['ThreeColumns', ThreeColumns],
    ['WithHeading', WithHeading],
    ['HeadingLevelTwo', HeadingLevelTwo],
    ['CustomEmptyText', CustomEmptyText],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('renders one dl, one div per item, each holding a dt and a dd', () => {
    const { container } = render(<Default />);
    expect(container.querySelectorAll('dl')).toHaveLength(1);
    const groups = container.querySelectorAll('dl > div');
    expect(groups).toHaveLength(5);
    for (const group of groups) {
      expect(group.children[0]?.tagName).toBe('DT');
      expect(group.children[1]?.tagName).toBe('DD');
    }
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Project lead',
      'Status',
      'Region',
      'Budget',
      'Summary',
    ]);
  });

  it('defaults to two columns and tells the skin the number it was given', () => {
    const { container: defaultContainer } = render(<Default />);
    expect(defaultContainer.querySelector('dl')).toHaveAttribute('data-columns', '2');
    const { container: oneContainer } = render(<OneColumn />);
    expect(oneContainer.querySelector('dl')).toHaveAttribute('data-columns', '1');
    const { container: threeContainer } = render(<ThreeColumns />);
    expect(threeContainer.querySelector('dl')).toHaveAttribute('data-columns', '3');
  });

  it('has no heading, and names nothing, unless given one', () => {
    const { container } = render(<Default />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('dl')).not.toHaveAttribute('aria-labelledby');
  });

  it('is named by its heading, which is an h3 by default', () => {
    const { container } = render(<WithHeading />);
    const heading = screen.getByRole('heading', { level: 3, name: 'Project details' });
    expect(container.querySelector('dl')).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading.id).not.toBe('');
  });

  it('takes the heading level it is told', () => {
    render(<HeadingLevelTwo />);
    expect(screen.getByRole('heading', { level: 2, name: 'Project details' })).toBeInTheDocument();
  });

  it('keeps two instances apart', () => {
    const { container } = render(
      <>
        <Descriptions heading="First" items={[]} />
        <Descriptions heading="Second" items={[]} />
      </>,
    );
    const [first, second] = [...container.querySelectorAll('dl')];
    expect(first?.getAttribute('aria-labelledby')).not.toBe(
      second?.getAttribute('aria-labelledby'),
    );
  });

  it('shows the em dash for an empty value, and the given text when there is one', () => {
    const { container, unmount } = render(<Default />);
    const budgetGroup = [...container.querySelectorAll('dl > div')][3] as HTMLElement;
    expect(within(budgetGroup).getByRole('definition')).toHaveTextContent('—');
    unmount();

    const custom = render(<CustomEmptyText />);
    const customGroup = [...custom.container.querySelectorAll('dl > div')][3] as HTMLElement;
    expect(within(customGroup).getByRole('definition')).toHaveTextContent('Not set');
  });

  it('keeps zero, which is a value', () => {
    render(<Descriptions items={[{ id: 'count', label: 'Count', value: 0 }]} />);
    expect(screen.getByRole('definition')).toHaveTextContent('0');
  });

  it('says how far an item spans, and never further than the columns there are', () => {
    const { container } = render(
      <Descriptions
        columns={2}
        items={[
          { id: 'plain', label: 'Plain', value: 'one' },
          { id: 'wide', label: 'Wide', value: 'two', span: 2 },
          { id: 'too-wide', label: 'Too wide', value: 'three', span: 3 },
        ]}
      />,
    );
    const [plain, wide, tooWide] = [...container.querySelectorAll('dl > div')];
    expect(plain).not.toHaveAttribute('data-span');
    expect(wide).toHaveAttribute('data-span', '2');
    expect(tooWide).toHaveAttribute('data-span', '2');
  });
});

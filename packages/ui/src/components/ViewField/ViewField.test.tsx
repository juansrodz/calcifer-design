import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { ViewField } from './ViewField';
import * as stories from './ViewField.stories';

const { Default, Inline, RichValue, Empty, CustomEmptyText, LongValue, Dark } =
  composeStories(stories);

describe('ViewField', () => {
  it.each([
    ['Default', Default],
    ['Inline', Inline],
    ['RichValue', RichValue],
    ['Empty', Empty],
    ['CustomEmptyText', CustomEmptyText],
    ['LongValue', LongValue],
    ['Dark', Dark],
  ])('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  it('renders dl > div > dt + dd', () => {
    const { container } = render(<Default />);
    const list = container.firstElementChild;
    expect(list?.tagName).toBe('DL');
    const group = list?.firstElementChild;
    expect(group?.tagName).toBe('DIV');
    expect(group?.children).toHaveLength(2);
    expect(group?.children[0]?.tagName).toBe('DT');
    expect(group?.children[0]).toHaveTextContent('Project lead');
    expect(group?.children[1]?.tagName).toBe('DD');
    expect(group?.children[1]).toHaveTextContent('Ada Lovelace');
  });

  it('exposes the pair as a term and its definition', () => {
    render(<Default />);
    expect(screen.getByRole('term')).toHaveTextContent('Project lead');
    expect(screen.getByRole('definition')).toHaveTextContent('Ada Lovelace');
  });

  it('is stacked unless asked otherwise, and says which on the group for the skin', () => {
    const { container: stackedContainer } = render(<Default />);
    expect(stackedContainer.querySelector('[data-layout]')).toHaveAttribute(
      'data-layout',
      'stacked',
    );
    const { container: inlineContainer } = render(<Inline />);
    expect(inlineContainer.querySelector('[data-layout]')).toHaveAttribute('data-layout', 'inline');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['an empty string', ''],
  ])('shows the em dash for %s', (_name, value) => {
    render(<ViewField label="Lead">{value}</ViewField>);
    expect(screen.getByRole('definition')).toHaveTextContent('—');
  });

  it.each([
    ['zero', 0, '0'],
    ['the word none', 'none', 'none'],
  ])('keeps %s, which is a value', (_name, value, expected) => {
    render(<ViewField label="Count">{value}</ViewField>);
    expect(screen.getByRole('definition')).toHaveTextContent(expected);
    expect(screen.getByRole('definition')).not.toHaveAttribute('data-empty');
  });

  it('takes its own empty text, and marks an empty value so the skin can quieten it', () => {
    render(<CustomEmptyText />);
    const definition = screen.getByRole('definition');
    expect(definition).toHaveTextContent('Not assigned yet');
    expect(definition).toHaveAttribute('data-empty');
  });

  it('renders any node as the value', () => {
    render(<RichValue />);
    expect(screen.getByRole('definition')).toHaveTextContent('Live');
    expect(screen.getByRole('definition')).not.toHaveAttribute('data-empty');
  });
});

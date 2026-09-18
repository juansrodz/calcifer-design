import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installMatchMedia } from '../../test/matchMedia';
import { Alert } from '../components/Alert/Alert';
import { Avatar } from '../components/Avatar/Avatar';
import * as dataTableStories from '../components/DataTable/DataTable.stories';
import { LiveRegion } from '../components/LiveRegion/LiveRegion';
import { Spinner } from '../components/Spinner/Spinner';
import { StatusDot } from '../components/StatusDot/StatusDot';

const { Stacked } = composeStories(dataTableStories);

const stylesRoot = path.resolve(import.meta.dirname, '.');
const componentsRoot = path.resolve(import.meta.dirname, '../components');

async function collectStylesheets(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectStylesheets(entryPath)));
    } else if (entry.name.endsWith('.module.css')) {
      files.push(entryPath);
    }
  }
  return files;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the visually-hidden block', () => {
  it('is declared once, and no component stylesheet keeps a copy', async () => {
    const stylesheets = await collectStylesheets(componentsRoot);
    expect(stylesheets.length).toBeGreaterThan(10);
    const offenders: string[] = [];
    for (const stylesheet of stylesheets) {
      const css = await readFile(stylesheet, 'utf8');
      if (css.includes('clip-path: inset(50%)')) {
        offenders.push(path.basename(stylesheet));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps every declaration the pattern needs, so no copy can go lossy again', async () => {
    const css = await readFile(path.join(stylesRoot, 'a11y.module.css'), 'utf8');
    // The four that DataTable's second copy dropped are the reason this list is spelled out:
    // without `margin: -1px` the 1px box still takes part in layout, and without
    // `white-space: nowrap` the clipped text can wrap to an arbitrary height.
    for (const declaration of [
      'position: absolute',
      'width: 1px',
      'height: 1px',
      'margin: -1px',
      'padding: 0',
      'overflow: hidden',
      'clip-path: inset(50%)',
      'white-space: nowrap',
      'border: 0',
    ]) {
      expect(css, declaration).toContain(declaration);
    }
  });

  it('hides the live region itself', () => {
    render(<LiveRegion message="Loading Federation Showcase" />);
    expect(screen.getByRole('status')).toHaveClass('visuallyHidden');
  });

  it("hides Alert's tone word, which is what keeps colour from being the only signal", () => {
    render(<Alert tone="warning">Two versions behind.</Alert>);
    expect(screen.getByText('Warning')).toHaveClass('visuallyHidden');
  });

  it("hides Avatar's full name, leaving the initials decorative", () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText('Ada Lovelace')).toHaveClass('visuallyHidden');
  });

  it("hides Spinner's label inside its status region", () => {
    render(<Spinner label="Loading projects" />);
    expect(screen.getByText('Loading projects')).toHaveClass('visuallyHidden');
  });

  it("hides StatusDot's label when the caller asks for it, and not otherwise", () => {
    const { rerender } = render(<StatusDot status="loaded" label="showcase" showLabel={false} />);
    expect(screen.getByText('showcase')).toHaveClass('visuallyHidden');
    rerender(<StatusDot status="loaded" label="showcase" />);
    expect(screen.getByText('showcase')).not.toHaveClass('visuallyHidden');
  });

  it("hides DataTable's header row when it stacks, keeping the columns in the tree", () => {
    installMatchMedia(false);
    const { container } = render(<Stacked />);
    expect(container.querySelector('thead')).toHaveClass('visuallyHidden');
    expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
  });
});

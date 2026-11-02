import { composeStories } from '@storybook/react';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeDocument } from '../../../test/axe';
import { Form } from '../Form/Form';
import { Upload, type UploadProps } from './Upload';
import * as stories from './Upload.stories';

const allStories = composeStories(stories);

const pdf = new File(['pdf'], 'report.pdf', { type: 'application/pdf', lastModified: 1 });
const png = new File(['png'], 'photo.png', { type: 'image/png', lastModified: 2 });
const text = new File(['txt'], 'notes.txt', { type: 'text/plain', lastModified: 3 });
/** A file whose type the operating system did not say, which is common for odd extensions. */
const untyped = new File(['x'], 'data.CSV', { lastModified: 4 });
const bytes = (size: number, fileName = 'sized.bin') =>
  new File([new Uint8Array(size)], fileName, { lastModified: size });

function input(): HTMLInputElement {
  return screen.getByLabelText<HTMLInputElement>('Attachments');
}

function renderUpload(props: Partial<UploadProps> = {}) {
  return render(<Upload label="Attachments" name="attachments" {...props} />);
}

function zone() {
  return input().parentElement as HTMLElement;
}

function dataTransfer(files: File[]) {
  return { files, types: ['Files'], dropEffect: 'none' };
}

function fileNames() {
  return screen.queryAllByRole('listitem').map((row) => row.firstChild?.textContent);
}

/** The newest announcement, without the no-break space that makes repeats audible. */
function announced() {
  return screen.getByRole('status').textContent?.replace(' ', '');
}

describe('Upload', () => {
  it.each(Object.entries(allStories))('%s has no axe violations', async (_name, Story) => {
    render(<Story />);
    expect(await axeDocument()).toHaveNoViolations();
  });

  describe('the real input', () => {
    it('is a file input, named by the label, in the tab order once', async () => {
      renderUpload({ accept: '.pdf', multiple: true });
      expect(input()).toHaveAttribute('type', 'file');
      expect(input()).toHaveAttribute('name', 'attachments');
      expect(input()).toHaveAttribute('accept', '.pdf');
      expect(input()).toHaveAttribute('multiple');
      await userEvent.tab();
      expect(input()).toHaveFocus();
      await userEvent.tab();
      expect(document.body).toHaveFocus();
    });

    it('hides the picture of a button from assistive technology', () => {
      renderUpload();
      expect(screen.queryByRole('button')).toBeNull();
      expect(screen.getByText('Choose a file').closest('[aria-hidden="true"]')).not.toBeNull();
    });

    it('is described by its description and error, and marked invalid', () => {
      renderUpload({ description: 'One PDF.', error: 'Not signed.' });
      expect(input()).toHaveAccessibleDescription('One PDF. Not signed.');
      expect(input()).toHaveAttribute('aria-invalid', 'true');
    });

    it('calls onBlur as focus leaves it', async () => {
      const onBlur = vi.fn();
      renderUpload({ onBlur });
      input().focus();
      await userEvent.tab();
      expect(onBlur).toHaveBeenCalled();
    });

    it('resets, so that choosing the same file again is reported again', async () => {
      const onFilesChange = vi.fn();
      renderUpload({ onFilesChange });
      await userEvent.upload(input(), pdf);
      expect(input().value).toBe('');
      await userEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' }));
      await userEvent.upload(input(), pdf);
      expect(onFilesChange).toHaveBeenCalledTimes(3);
      expect(onFilesChange).toHaveBeenLastCalledWith([pdf]);
      expect(fileNames()).toEqual(['report.pdf']);
    });

    it('reports a file turned away each time it is chosen', async () => {
      const onReject = vi.fn();
      renderUpload({ maxSizeBytes: 1, onReject });
      await userEvent.upload(input(), pdf);
      await userEvent.upload(input(), pdf);
      expect(onReject).toHaveBeenCalledTimes(2);
    });
  });

  describe('choosing', () => {
    it('lists the file and reports the whole list in one argument', async () => {
      const onFilesChange = vi.fn();
      renderUpload({ onFilesChange });
      await userEvent.upload(input(), pdf);
      expect(onFilesChange.mock.calls).toEqual([[[pdf]]]);
      expect(fileNames()).toEqual(['report.pdf']);
    });

    it('replaces the file when not multiple', async () => {
      renderUpload();
      await userEvent.upload(input(), pdf);
      await userEvent.upload(input(), png);
      expect(fileNames()).toEqual(['photo.png']);
    });

    it('adds to the list when multiple, and counts the same file once', async () => {
      const onFilesChange = vi.fn();
      renderUpload({ multiple: true, onFilesChange });
      await userEvent.upload(input(), [pdf, png]);
      await userEvent.upload(input(), [png, text]);
      expect(fileNames()).toEqual(['report.pdf', 'photo.png', 'notes.txt']);
      expect(onFilesChange).toHaveBeenLastCalledWith([pdf, png, text]);
      await userEvent.upload(input(), pdf);
      expect(onFilesChange).toHaveBeenCalledTimes(2);
    });

    it('uses a list without list-style semantics lost', async () => {
      renderUpload({ defaultFiles: [pdf] });
      expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
    });

    it('holds no list at all while empty', () => {
      renderUpload();
      expect(screen.queryByRole('list')).toBeNull();
    });
  });

  describe('turning files away', () => {
    it.each([
      ['an extension', '.pdf', pdf, true],
      ['an extension in any case', '.csv', untyped, true],
      ['a wildcard', 'image/*', png, true],
      ['an exact type', 'application/pdf', pdf, true],
      ['one of a list, with spaces', ' .txt , image/* ', png, true],
      ['the wrong extension', '.pdf', text, false],
      ['the wrong wildcard', 'image/*', pdf, false],
      ['a type the file does not state', 'text/csv', untyped, false],
    ])('checks accept by %s on a drop', (_label, accept, file, passes) => {
      const onReject = vi.fn();
      const onFilesChange = vi.fn();
      renderUpload({ accept, onReject, onFilesChange });
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([file]) });
      expect(onFilesChange).toHaveBeenCalledTimes(passes ? 1 : 0);
      expect(onReject.mock.calls).toEqual(passes ? [] : [[[{ file, reason: 'type' }]]]);
    });

    it('checks accept on a file from the picker too', async () => {
      const onReject = vi.fn();
      renderUpload({ accept: '.pdf', onReject });
      const user = userEvent.setup({ applyAccept: false });
      await user.upload(input(), text);
      expect(onReject).toHaveBeenCalledWith([{ file: text, reason: 'type' }]);
    });

    it('checks the size, with exactly the limit allowed', () => {
      const onReject = vi.fn();
      renderUpload({ maxSizeBytes: 10, multiple: true, onReject });
      const fits = bytes(10, 'fits.bin');
      const over = bytes(11, 'over.bin');
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([fits, over]) });
      expect(fileNames()).toEqual(['fits.bin']);
      expect(onReject).toHaveBeenCalledWith([{ file: over, reason: 'size' }]);
    });

    it('takes the first of a drop when not multiple, and gives the rest a count reason', () => {
      const onReject = vi.fn();
      renderUpload({ onReject });
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([pdf, png, text]) });
      expect(fileNames()).toEqual(['report.pdf']);
      expect(onReject).toHaveBeenCalledWith([
        { file: png, reason: 'count' },
        { file: text, reason: 'count' },
      ]);
    });

    it('gives each file its own reason in one call', () => {
      const onReject = vi.fn();
      renderUpload({ accept: '.pdf,.bin', maxSizeBytes: 5, onReject });
      const large = bytes(50);
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([text, large, pdf, png]) });
      expect(onReject.mock.calls).toEqual([
        [
          [
            { file: text, reason: 'type' },
            { file: large, reason: 'size' },
            { file: png, reason: 'type' },
          ],
        ],
      ]);
      expect(fileNames()).toEqual(['report.pdf']);
    });

    it('checks type first, then size, then count', () => {
      const onReject = vi.fn();
      renderUpload({ accept: '.pdf', maxSizeBytes: 1, onReject });
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([text]) });
      expect(onReject).toHaveBeenLastCalledWith([{ file: text, reason: 'type' }]);
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([pdf]) });
      expect(onReject).toHaveBeenLastCalledWith([{ file: pdf, reason: 'size' }]);
    });

    it('says why on the page, and stops saying so at the next good choice', () => {
      renderUpload({ accept: '.pdf' });
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([text]) });
      expect(
        screen.getByText('notes.txt was not added: that type of file is not allowed.', {
          selector: 'p',
        }),
      ).toBeVisible();
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([pdf]) });
      expect(screen.queryByText(/was not added/)).toBeNull();
    });

    it('shows both when two files of one name are turned away, with no key warning', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      renderUpload({ accept: '.pdf', multiple: true });
      fireEvent.drop(zone(), {
        dataTransfer: dataTransfer([text, new File(['other'], 'notes.txt')]),
      });
      expect(screen.getAllByText(/^notes.txt was not added/, { selector: 'p' })).toHaveLength(2);
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('keeps the files it has when the new one is turned away', async () => {
      const onFilesChange = vi.fn();
      renderUpload({ accept: '.pdf', defaultFiles: [pdf], onFilesChange });
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([text]) });
      expect(fileNames()).toEqual(['report.pdf']);
      expect(onFilesChange).not.toHaveBeenCalled();
    });
  });

  describe('dropping', () => {
    it('marks the zone while something is over it, and cancels the browser default', () => {
      renderUpload();
      const notPrevented = fireEvent.dragOver(zone(), { dataTransfer: dataTransfer([pdf]) });
      expect(notPrevented).toBe(false);
      expect(zone()).toHaveAttribute('data-dragging');
      fireEvent.dragLeave(zone());
      expect(zone()).not.toHaveAttribute('data-dragging');
    });

    it('stays marked while the pointer moves between its own parts', () => {
      renderUpload();
      fireEvent.dragOver(zone(), { dataTransfer: dataTransfer([pdf]) });
      // jsdom has no `DragEvent`, and its plain `Event` drops `relatedTarget` from the init.
      const leave = createEvent.dragLeave(zone());
      Object.defineProperty(leave, 'relatedTarget', { value: input() });
      fireEvent(zone(), leave);
      expect(zone()).toHaveAttribute('data-dragging');
    });

    it('stops the browser opening the dropped file, and ends the mark', () => {
      renderUpload();
      fireEvent.dragOver(zone(), { dataTransfer: dataTransfer([pdf]) });
      const notPrevented = fireEvent.drop(zone(), { dataTransfer: dataTransfer([pdf]) });
      expect(notPrevented).toBe(false);
      expect(zone()).not.toHaveAttribute('data-dragging');
      expect(fileNames()).toEqual(['report.pdf']);
    });

    it('ignores a drag that holds no files', () => {
      const onFilesChange = vi.fn();
      renderUpload({ onFilesChange });
      const notPrevented = fireEvent.dragOver(zone(), {
        dataTransfer: { files: [], types: ['text/plain'] },
      });
      expect(notPrevented).toBe(true);
      expect(zone()).not.toHaveAttribute('data-dragging');
      fireEvent.drop(zone(), { dataTransfer: { files: [], types: ['text/plain'] } });
      expect(onFilesChange).not.toHaveBeenCalled();
    });

    it('refuses a drop when disabled, without letting the browser open the file', () => {
      const onFilesChange = vi.fn();
      const onReject = vi.fn();
      renderUpload({ disabled: true, onFilesChange, onReject });
      const transfer = dataTransfer([pdf]);
      expect(fireEvent.dragOver(zone(), { dataTransfer: transfer })).toBe(false);
      expect(transfer.dropEffect).toBe('none');
      expect(zone()).not.toHaveAttribute('data-dragging');
      expect(fireEvent.drop(zone(), { dataTransfer: transfer })).toBe(false);
      expect(onFilesChange).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();
      expect(fileNames()).toEqual([]);
    });
  });

  describe('removing', () => {
    it('names each remove button after its file', () => {
      renderUpload({ multiple: true, defaultFiles: [pdf, png] });
      expect(screen.getByRole('button', { name: 'Remove report.pdf' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Remove photo.png' })).toBeVisible();
    });

    it('removes only that file, reports the rest, and announces it', async () => {
      const onFilesChange = vi.fn();
      renderUpload({ multiple: true, defaultFiles: [pdf, png, text], onFilesChange });
      await userEvent.click(screen.getByRole('button', { name: 'Remove photo.png' }));
      expect(fileNames()).toEqual(['report.pdf', 'notes.txt']);
      expect(onFilesChange.mock.calls).toEqual([[[pdf, text]]]);
      expect(announced()).toBe('Removed photo.png.');
    });

    it('moves focus to the next button, then the previous, then the input', async () => {
      renderUpload({ multiple: true, defaultFiles: [pdf, png] });
      await userEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' }));
      expect(screen.getByRole('button', { name: 'Remove photo.png' })).toHaveFocus();
      await userEvent.click(screen.getByRole('button', { name: 'Remove photo.png' }));
      expect(input()).toHaveFocus();
    });

    it('moves focus back when the last of several goes', async () => {
      renderUpload({ multiple: true, defaultFiles: [pdf, png] });
      await userEvent.click(screen.getByRole('button', { name: 'Remove photo.png' }));
      expect(screen.getByRole('button', { name: 'Remove report.pdf' })).toHaveFocus();
    });

    it('cannot remove while disabled', () => {
      renderUpload({ disabled: true, defaultFiles: [pdf] });
      expect(screen.getByRole('button', { name: 'Remove report.pdf' })).toBeDisabled();
      expect(input()).toBeDisabled();
    });
  });

  describe('announcing', () => {
    it('says what joined', async () => {
      renderUpload({ multiple: true });
      await userEvent.upload(input(), [pdf, png]);
      expect(announced()).toBe('Added report.pdf, photo.png.');
    });

    it('says what was turned away and why', () => {
      renderUpload({ accept: '.pdf', multiple: true });
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([pdf, text]) });
      expect(announced()).toBe(
        'Added report.pdf. notes.txt was not added: that type of file is not allowed.',
      );
    });

    it('changes the region text when the same thing happens twice, so it is said twice', () => {
      renderUpload({ accept: '.pdf' });
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([text]) });
      const first = screen.getByRole('status').textContent;
      fireEvent.drop(zone(), { dataTransfer: dataTransfer([text]) });
      expect(screen.getByRole('status').textContent).not.toBe(first);
    });

    it('takes its words from labels', async () => {
      renderUpload({
        labels: {
          choose: 'Elegir',
          dropHint: 'o soltar',
          remove: (fileName) => `Quitar ${fileName}`,
          added: (fileNames) => `Añadido ${fileNames}`,
        },
      });
      expect(screen.getByText('Elegir')).toBeVisible();
      expect(screen.getByText('o soltar')).toBeVisible();
      await userEvent.upload(input(), pdf);
      expect(screen.getByRole('button', { name: 'Quitar report.pdf' })).toBeVisible();
      expect(announced()).toBe('Añadido report.pdf');
    });
  });

  describe('controlled files', () => {
    it('shows what it is given and follows a change, with no warning', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      function Controlled() {
        const [files, setFiles] = useState<File[]>([pdf]);
        return (
          <>
            <Upload label="Attachments" multiple files={files} onFilesChange={setFiles} />
            <button type="button" onClick={() => setFiles([])}>
              Empty
            </button>
          </>
        );
      }
      render(<Controlled />);
      expect(fileNames()).toEqual(['report.pdf']);
      await userEvent.upload(input(), png);
      expect(fileNames()).toEqual(['report.pdf', 'photo.png']);
      await userEvent.click(screen.getByRole('button', { name: 'Empty' }));
      expect(fileNames()).toEqual([]);
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('stays as the parent has it when the parent refuses the change', async () => {
      const onFilesChange = vi.fn();
      render(<Upload label="Attachments" files={[pdf]} onFilesChange={onFilesChange} />);
      await userEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' }));
      expect(onFilesChange).toHaveBeenCalledWith([]);
      expect(fileNames()).toEqual(['report.pdf']);
    });

    it('goes from uncontrolled to controlled with no warning', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const { rerender } = render(<Upload label="Attachments" />);
      rerender(<Upload label="Attachments" files={[pdf]} />);
      expect(fileNames()).toEqual(['report.pdf']);
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('takes two files with the same name without a key warning', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      render(<Upload label="Attachments" files={[pdf, pdf]} />);
      expect(fileNames()).toHaveLength(2);
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('inside Form', () => {
    const save = <button type="submit">Save</button>;

    it('hands onSubmit an array of File objects, even with one or none', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Upload label="Attachments" name="attachments" defaultFiles={[pdf]} />
          <Upload label="Others" name="others" />
          {save}
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ attachments: [pdf], others: [] });
      const submitted = onSubmit.mock.calls[0]?.[0] as { attachments: File[] };
      expect(submitted.attachments[0]).toBeInstanceOf(File);
    });

    it('hands onSubmit what was chosen and removed since, and nothing when disabled', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Upload label="Attachments" name="attachments" multiple defaultFiles={[pdf]} />
          <Upload label="Locked" name="locked" disabled defaultFiles={[text]} />
          {save}
        </Form>,
      );
      await userEvent.upload(input(), png);
      await userEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ attachments: [png] });
    });

    it('shows an entry in errors, marks it invalid, and takes focus on submit', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit} errors={{ attachments: 'Not signed.' }}>
          <Upload label="Attachments" name="attachments" />
          {save}
        </Form>,
      );
      expect(screen.getByText('Not signed.')).toBeVisible();
      expect(input()).toHaveAccessibleDescription('Not signed.');
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(input()).toHaveFocus();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('lets an explicit error win', () => {
      render(
        <Form onSubmit={() => undefined} errors={{ attachments: 'From the server.' }}>
          <Upload label="Attachments" name="attachments" error="Explicit." />
        </Form>,
      );
      expect(screen.getByText('Explicit.')).toBeVisible();
      expect(screen.queryByText('From the server.')).toBeNull();
    });

    it.each([
      ['choosing a file', async () => userEvent.upload(input(), png)],
      [
        'dropping a file',
        async () => void fireEvent.drop(zone(), { dataTransfer: dataTransfer([png]) }),
      ],
      [
        'removing a file',
        async () => userEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' })),
      ],
    ])('clears the entry on %s', async (_label, change) => {
      render(
        <Form onSubmit={() => undefined} errors={{ attachments: 'Not signed.' }}>
          <Upload label="Attachments" name="attachments" defaultFiles={[pdf]} />
        </Form>,
      );
      await change();
      expect(screen.queryByText('Not signed.')).toBeNull();
      expect(input()).not.toHaveAttribute('aria-invalid');
    });

    it('blocks when required and empty, and lets through once a file is chosen', async () => {
      const onSubmit = vi.fn();
      render(
        <Form onSubmit={onSubmit}>
          <Upload label="Attachments" name="attachments" required />
          {save}
        </Form>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(input()).toHaveFocus();
      expect(input()).toHaveAttribute('aria-invalid', 'true');
      await userEvent.upload(input(), pdf);
      expect(input()).not.toHaveAttribute('required');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith({ attachments: [pdf] });
    });
  });
});

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Upload, type UploadProps } from './Upload';

const report = new File(['quarterly numbers'], 'report.pdf', { type: 'application/pdf' });
const photo = new File(['pixels'], 'team-photo.png', { type: 'image/png' });
const longName = new File(
  ['words'],
  'a-very-long-file-name-that-has-to-wrap-on-a-phone-rather-than-push-the-remove-button-away.txt',
  { type: 'text/plain' },
);

const meta = {
  title: 'Forms/Upload',
  component: Upload,
  args: { label: 'Attachments', name: 'attachments', onFilesChange: fn(), onReject: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '28rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Upload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Multiple: Story = { args: { multiple: true, defaultFiles: [report, photo] } };
export const WithFile: Story = { args: { defaultFiles: [report] } };
export const LongName: Story = { args: { defaultFiles: [longName] } };
/** Try dropping something else: `accept` and the size limit are checked for drops as well. */
export const Restricted: Story = {
  args: {
    accept: '.pdf,image/*',
    maxSizeBytes: 1024,
    description: 'A PDF or an image, up to 1 KB.',
  },
};
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultFiles: [report] } };
export const WithError: Story = {
  args: { error: 'Attach the signed form.', defaultFiles: [photo] },
};

function ControlledUpload(props: UploadProps) {
  const [files, setFiles] = useState<File[]>([report]);
  return <Upload {...props} multiple files={files} onFilesChange={setFiles} />;
}
export const Controlled: Story = { render: (args) => <ControlledUpload {...args} /> };
export const Dark: Story = { globals: { theme: 'dark' }, args: { defaultFiles: [report] } };

import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import '@calcifer-design/tokens/tokens.css';
import '@calcifer-design/ui/base.css';
import { createToastManager, ToastRegion } from '@calcifer-design/ui';
import { createRoot } from 'react-dom/client';
import { DocsApp } from './app';
import { StandaloneFrame } from './standalone-frame';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element');
}

// Standalone there is no host to own the region, so this entry creates the one manager and
// mounts the one ToastRegion, then hands the app the same object a shell would have handed it
// (spec §5.3). The federated entry mounts neither and imports none of the CSS above.
const standaloneToast = createToastManager();

createRoot(container).render(
  <StandaloneFrame>
    <DocsApp hostToast={standaloneToast} />
    <ToastRegion manager={standaloneToast} />
  </StandaloneFrame>,
);

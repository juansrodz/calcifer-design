import { createBridgeComponent, type ProviderFnParams } from '@module-federation/bridge-react/v19';
import { DocsApp, type DocsAppProps } from '../app';
import { createDeferredRoot } from './deferred-root';

// Exposed as "./app" — the key `EXPOSED_APP_KEY` names in the portfolio's contract
// (portfolio-mfe, packages/contract/src/remote-app.ts), mirrored in src/app-identity.ts.
//
// No stylesheet is imported here, and no ToastRegion is mounted: inside the shell the tokens
// and base stylesheet are already on the page and the host owns the one toast region (spec
// §6.1, §5.3). Only `hostToast` is forwarded — the Bridge also passes `basename`, which this
// app has no use for because it has no routes.
//
// `createBridgeComponent`'s own parameter type omits `createRoot` even though the
// implementation spreads this object over its React 19 default and does honour an override;
// assigning to a fully-typed `ProviderFnParams` const first sidesteps that mismatch.
const bridgeInfo: ProviderFnParams<DocsAppProps> = {
  rootComponent: (props) => <DocsApp hostToast={props.hostToast} />,
  createRoot: createDeferredRoot,
};

export default createBridgeComponent(bridgeInfo);

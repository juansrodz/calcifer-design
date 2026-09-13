import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert } from '../Alert/Alert';
import { Button } from '../Button/Button';
import styles from './ErrorBoundary.module.css';

export interface ErrorBoundaryFallbackDetails {
  error: Error;
  /** Clears the caught error and renders the children again. */
  reset: () => void;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the children once an error has been caught. */
  fallback?: (details: ErrorBoundaryFallbackDetails) => ReactNode;
  /** Called once per caught error, for logging. The second argument is the component stack. */
  onError?: (error: Error, componentStack: string) => void;
  /**
   * When any value here changes, a boundary that has caught an error renders its children again.
   * Pass the route path to clear a failure automatically when the user navigates away from it.
   */
  resetKeys?: readonly unknown[];
  /** The default fallback's heading. */
  heading?: string;
  /** The heading's level. Match it to where the alert sits in the page's outline. */
  headingLevel?: 2 | 3 | 4;
  /** The default fallback's retry control. */
  retryLabel?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * The library's only class component: `getDerivedStateFromError` and `componentDidCatch` exist
 * on classes alone, so an error boundary cannot be written as a function.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo.componentStack ?? '');
  }

  override componentDidUpdate(previousProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    if (this.state.error === null || resetKeys === undefined) {
      return;
    }
    const previousKeys = previousProps.resetKeys ?? [];
    const changed =
      resetKeys.length !== previousKeys.length ||
      resetKeys.some((key, keyIndex) => !Object.is(key, previousKeys[keyIndex]));
    if (changed) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    const { error } = this.state;
    const {
      children,
      fallback,
      heading = 'Something went wrong',
      headingLevel = 3,
      retryLabel = 'Try again',
    } = this.props;

    if (error === null) {
      return children;
    }

    if (fallback !== undefined) {
      return fallback({ error, reset: this.reset });
    }

    return (
      <div className={styles.root}>
        {/* `announce` is right here and wrong for most alerts: this one only ever appears after
            the page has already rendered, in response to something that just failed. */}
        <Alert tone="danger" announce heading={heading} headingLevel={headingLevel}>
          {error.message}
        </Alert>
        <Button variant="secondary" size="sm" onClick={this.reset}>
          {retryLabel}
        </Button>
      </div>
    );
  }
}

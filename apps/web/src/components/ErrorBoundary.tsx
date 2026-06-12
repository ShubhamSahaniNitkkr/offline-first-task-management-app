import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button, Stack, Text, Title } from '@mantine/core';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Feature error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert color="red" title={this.props.fallbackTitle ?? 'Something went wrong'} role="alert">
          <Stack gap="sm">
            <Text size="sm">{this.state.error?.message ?? 'An unexpected error occurred'}</Text>
            <Button
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
              aria-label="Retry loading this section"
            >
              Retry
            </Button>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary fallbackTitle="Page failed to load">
      {children}
    </FeatureErrorBoundary>
  );
}

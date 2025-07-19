import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

export class ModalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">Something went wrong</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              if (this.props.onReset) {
                this.props.onReset();
              }
            }}
            className="btn-primary px-4 py-2"
          >
            Close
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 
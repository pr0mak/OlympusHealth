import { Component } from 'react';

export default class ViewerErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="anatomy-message" role="alert">
          <h3>The 3D viewer could not load.</h3>
          <p>Check your connection and that WebGL is enabled in your browser.</p>
          <button type="button" onClick={this.props.onRetry}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

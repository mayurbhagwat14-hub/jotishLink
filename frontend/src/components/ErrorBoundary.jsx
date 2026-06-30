import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='p-8 text-red-500 bg-white min-h-screen'>
          <h1 className='text-2xl font-bold mb-4'>Something went wrong.</h1>
          <pre className='bg-gray-100 p-4 rounded text-sm overflow-auto text-gray-800 whitespace-pre-wrap break-all'>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

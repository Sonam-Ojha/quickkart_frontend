import { Component, type ReactNode } from 'react';

export class ModuleErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div role="alert" className="max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Page could not load</h1>
          <p className="mt-3 text-sm text-gray-600">
            Please check your connection and reload the page. If this continues, contact your administrator.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-[#EA580C] px-5 py-3 font-semibold text-white"
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}

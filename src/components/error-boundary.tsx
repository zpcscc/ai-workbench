import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

type State = { error?: Error };

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-canvas p-6 text-ink">
        <section className="app-card max-w-xl p-6" role="alert">
          <h1 className="text-lg font-semibold">应用遇到意外错误</h1>
          <p className="mt-2 text-sm text-subtle">请重新加载应用；如果问题持续存在，可复制下面的信息用于排查。</p>
          <pre className="mt-4 max-h-48 overflow-auto rounded bg-muted p-3 text-xs">{this.state.error.message}</pre>
          <button className="app-button app-button-primary mt-4" onClick={() => window.location.reload()} type="button">重新加载</button>
        </section>
      </main>
    );
  }
}

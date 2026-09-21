export function ChatPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">AI 对话</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">等待本地运行时</h1>
      <p className="mt-3 max-w-2xl leading-7 text-subtle">对话功能将在模型下载、校验与 llama.cpp 运行时接入后启用。当前先完成模型的安全管理与设备兼容性判断。</p>
      <div className="app-card mt-8 p-5"><p className="font-semibold">下一步</p><p className="mt-2 text-sm leading-6 text-subtle">建立断点续传下载、SHA-256 校验和模型进程生命周期管理，然后开放基础的离线文本对话。</p></div>
    </section>
  );
}

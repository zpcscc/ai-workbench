export function ModelCenterHeader() {
  return (
    <header>
      <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">本地模型</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">模型中心</h1>
      <p className="mt-3 max-w-2xl leading-7 text-subtle">仅列出经过审核的官方模型。下载时会写入应用私有目录，支持续传，并在完成后校验 SHA-256。</p>
    </header>
  );
}

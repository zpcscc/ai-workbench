import type { DeviceInfo, ModelCatalog } from "../../types/model";
import { formatGigabytes } from "../../utils/format";

type ModelCenterPageProps = {
  catalog?: ModelCatalog;
  device?: DeviceInfo;
};

export function ModelCenterPage({ catalog, device }: ModelCenterPageProps) {
  return (
    <section className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">本地模型</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">模型中心</h1>
      <p className="mt-3 max-w-2xl leading-7 text-subtle">仅列出经过审核的官方模型。下载器将负责来源锁定、校验与本地运行时启动。</p>

      <section className="app-card mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-subtle">当前设备</p>
          <p className="mt-1 font-semibold">{device ? `${device.operatingSystem} · ${device.architecture} · ${device.logicalCpuCores} 个逻辑核心` : "正在检测…"}</p>
        </div>
        <p className="max-w-md text-sm leading-6 text-subtle">安装前会进一步检测内存、可用磁盘空间和 GPU，以决定是否推荐下载。</p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {catalog?.models.map((model) => (
          <article className="app-card flex flex-col p-5" key={model.id}>
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-lg font-semibold">{model.name}</h2><p className="mt-1 text-sm text-subtle">{model.quantization} · 仅本地运行</p></div>
              {model.recommended && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">推荐</span>}
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div><dt className="text-subtle">预计下载</dt><dd className="mt-1 font-medium">{formatGigabytes(model.estimatedDownloadBytes)}</dd></div>
              <div><dt className="text-subtle">建议内存</dt><dd className="mt-1 font-medium">{model.recommendedMemoryGiB} GB+</dd></div>
              <div><dt className="text-subtle">最低内存</dt><dd className="mt-1 font-medium">{model.minimumMemoryGiB} GB</dd></div>
              <div><dt className="text-subtle">许可证</dt><dd className="mt-1 font-medium">{model.license}</dd></div>
            </dl>
            <div className="mt-6 border-t border-border pt-4 text-xs leading-5 text-subtle"><p>来源：官方</p><p className="mt-1 break-all">{model.download.repository}</p></div>
            <button className="app-button mt-5 bg-muted text-subtle" disabled type="button">下载器即将接入</button>
          </article>
        ))}
      </div>
    </section>
  );
}

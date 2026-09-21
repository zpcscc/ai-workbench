import type { DeviceInfo, ModelCatalog } from "../../types/model";

type OverviewPageProps = {
  catalog?: ModelCatalog;
  device?: DeviceInfo;
  onOpenModels: () => void;
};

export function OverviewPage({ catalog, device, onOpenModels }: OverviewPageProps) {
  const recommendedModel = catalog?.models.find((model) => model.recommended);

  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">工作台</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">从本地 AI 开始</h1>
      <p className="mt-3 max-w-2xl leading-7 text-subtle">先选择适合设备的模型，完成下载与验证后，即可开始私密的本地对话。</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="app-card p-5">
          <p className="text-sm text-subtle">推荐起点</p>
          <h2 className="mt-2 text-xl font-semibold">{recommendedModel?.name ?? "正在加载模型目录…"}</h2>
          <p className="mt-2 text-sm leading-6 text-subtle">{recommendedModel ? `${recommendedModel.quantization} · 建议 ${recommendedModel.recommendedMemoryGiB} GB 内存` : ""}</p>
          <button className="app-button mt-5 bg-accent text-accent-ink hover:bg-accent/90" onClick={onOpenModels} type="button">查看本地模型</button>
        </article>
        <article className="app-card p-5">
          <p className="text-sm text-subtle">设备概览</p>
          <h2 className="mt-2 text-xl font-semibold">{device ? `${device.operatingSystem} · ${device.architecture}` : "正在检测…"}</h2>
          <p className="mt-2 text-sm leading-6 text-subtle">{device ? `${device.logicalCpuCores} 个逻辑 CPU 核心。完整内存与 GPU 评估将在模型下载前执行。` : ""}</p>
        </article>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">开发进度</h2>
        <ol className="mt-4 grid list-none gap-3 p-0 text-sm md:grid-cols-3">
          <li className="app-card p-4"><span className="text-accent">01</span><p className="mt-2 font-medium">桌面工作台</p><p className="mt-1 text-subtle">已完成</p></li>
          <li className="app-card p-4"><span className="text-accent">02</span><p className="mt-2 font-medium">模型管理器</p><p className="mt-1 text-subtle">进行中</p></li>
          <li className="app-card p-4"><span className="text-subtle">03</span><p className="mt-2 font-medium">本地 AI 对话</p><p className="mt-1 text-subtle">等待模型运行时</p></li>
        </ol>
      </section>
    </section>
  );
}

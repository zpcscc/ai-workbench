import type { ModelDefinition } from "../../../../../types/model";

export function RecommendedModelCard({ model, onOpenModels }: { model?: ModelDefinition; onOpenModels: () => void }) {
  return (
    <article className="app-card p-4">
      <p className="text-sm text-subtle">推荐起点</p>
      <h2 className="mt-2 text-xl font-semibold">{model?.name ?? "正在加载模型目录…"}</h2>
      <p className="mt-2 text-sm leading-6 text-subtle">{model ? `${model.quantization} · 建议 ${model.recommendedMemoryGiB} GB 内存` : ""}</p>
      <button className="app-button app-button-primary mt-4" onClick={onOpenModels} type="button">查看本地模型</button>
    </article>
  );
}

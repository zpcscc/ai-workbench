import type { ModelDefinition } from "../../../../../types/model";

export function ModelSource({ model }: { model: ModelDefinition }) {
  return <div className="mt-6 border-t border-border pt-4 text-xs leading-5 text-subtle"><p>来源：官方</p><p className="mt-1 break-all">{model.download.repository}</p></div>;
}

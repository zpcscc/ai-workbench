import type { DeviceInfo } from "../../../../../types/model";

export function DeviceSummaryCard({ device }: { device?: DeviceInfo }) {
  return (
    <article className="app-card p-5">
      <p className="text-sm text-subtle">设备概览</p>
      <h2 className="mt-2 text-xl font-semibold">{device ? `${device.operatingSystem} · ${device.architecture}` : "正在检测…"}</h2>
      <p className="mt-2 text-sm leading-6 text-subtle">{device ? `${device.logicalCpuCores} 个逻辑 CPU 核心。完整内存与 GPU 评估将在模型下载前执行。` : ""}</p>
    </article>
  );
}

import type { DeviceInfo } from "../../../types/model";

export function ModelDeviceSummary({ device }: { device?: DeviceInfo }) {
  return (
    <section className="app-card mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm text-subtle">当前设备</p><p className="mt-1 font-semibold">{device ? `${device.operatingSystem} · ${device.architecture} · ${device.logicalCpuCores} 个逻辑核心` : "正在检测…"}</p></div>
      <p className="max-w-md text-sm leading-6 text-subtle">安装前会进一步检测内存、可用磁盘空间和 GPU，以决定是否推荐下载。</p>
    </section>
  );
}

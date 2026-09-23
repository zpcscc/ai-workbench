import type { DeviceInfo } from "../../../types/model";

export function ModelDeviceSummary({ device }: { device?: DeviceInfo }) {
  return (
    <section className="mt-4 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm text-subtle">当前设备</p><p className="mt-1 font-semibold">{device ? `${device.operatingSystem} · ${device.architecture} · ${device.logicalCpuCores} 个逻辑核心` : "正在检测…"}</p></div>
      <p className="max-w-md text-xs leading-5 text-subtle">安装前会检测内存、磁盘空间和 GPU，并判断是否推荐。</p>
    </section>
  );
}

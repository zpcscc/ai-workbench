const progressItems = [
  { number: "01", title: "桌面工作台", status: "已完成", active: true },
  { number: "02", title: "模型管理器", status: "已完成", active: true },
  { number: "03", title: "本地 AI 对话", status: "基础对话可用", active: true },
];

export function DevelopmentProgress() {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">开发进度</h2>
      <ol className="mt-3 grid list-none gap-3 p-0 text-sm md:grid-cols-3">
        {progressItems.map((item) => (
          <li className="app-card p-4" key={item.number}>
            <span className={item.active ? "text-accent" : "text-subtle"}>{item.number}</span>
            <p className="mt-2 font-medium">{item.title}</p>
            <p className="mt-1 text-subtle">{item.status}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

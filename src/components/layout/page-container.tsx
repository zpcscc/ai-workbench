import type { PropsWithChildren } from "react";

type PageContainerProps = PropsWithChildren<{
  className?: string;
  size?: "compact" | "default" | "wide";
}>;

const widthClassNames: Record<NonNullable<PageContainerProps["size"]>, string> = {
  compact: "max-w-3xl",
  default: "max-w-4xl",
  wide: "max-w-5xl",
};

export function PageContainer({ children, className = "", size = "default" }: PageContainerProps) {
  return <section className={`mx-auto ${widthClassNames[size]} ${className}`}>{children}</section>;
}

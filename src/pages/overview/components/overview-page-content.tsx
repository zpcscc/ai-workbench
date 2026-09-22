import { DevelopmentProgress } from "../modules/development-progress";
import { OverviewSummary } from "../modules/overview-summary";
import { OverviewHeader } from "./overview-header";

export function OverviewPageContent() {
  return (
    <>
      <OverviewHeader />
      <OverviewSummary />
      <DevelopmentProgress />
    </>
  );
}

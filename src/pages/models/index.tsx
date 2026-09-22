import { PageContainer } from "../../components/layout/page-container";
import { ModelCenterPageContent } from "./components/model-center-page-content";
import { ModelCenterPageStateProvider } from "./state";

export function ModelCenterPage() {
  return (
    <PageContainer size="wide">
      <ModelCenterPageStateProvider>
        <ModelCenterPageContent />
      </ModelCenterPageStateProvider>
    </PageContainer>
  );
}

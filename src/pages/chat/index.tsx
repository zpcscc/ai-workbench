import { PageContainer } from "../../components/layout/page-container";
import { ChatPageContent } from "./components/chat-page-content";

export function ChatPage() {
  return (
    <PageContainer className="h-full min-h-0">
      <ChatPageContent />
    </PageContainer>
  );
}

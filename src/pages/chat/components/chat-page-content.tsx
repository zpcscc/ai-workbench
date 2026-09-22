import { useChatPageActions } from "../actions";
import { LocalChat } from "../modules/local-chat";
import { useChatPageState } from "../state";
import { ChatHeader } from "./chat-header";

export function ChatPageContent() {
  const state = useChatPageState();
  const actions = useChatPageActions(state);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader runtimeState={state.runtime.status.state} />
      <LocalChat actions={actions} state={state} />
    </div>
  );
}

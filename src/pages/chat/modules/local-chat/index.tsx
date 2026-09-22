import { createLocalChatModuleActions } from "./actions";
import { ChatComposer } from "./components/chat-composer";
import { ChatMessages } from "./components/chat-messages";
import { RuntimeControl } from "./components/runtime-control";
import { useLocalChatModuleState } from "./state";
import type { LocalChatProps } from "./types";

export function LocalChat(props: LocalChatProps) {
  const state = useLocalChatModuleState();
  const actions = createLocalChatModuleActions(state, props.actions);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RuntimeControl {...props} />
      <section className="app-card mt-4 flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <h2 className="shrink-0 font-semibold">离线对话</h2>
        <ChatMessages state={state} />
        <ChatComposer actions={actions} disabled={props.state.runtime.status.state !== "ready"} state={state} />
      </section>
    </div>
  );
}

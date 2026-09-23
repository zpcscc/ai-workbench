import { useEffect, useRef } from "react";
import { createLocalChatModuleActions } from "./actions";
import { ChatComposer } from "./components/chat-composer";
import { ChatMessages } from "./components/chat-messages";
import { RuntimeControl } from "./components/runtime-control";
import { useLocalChatModuleState } from "./state";
import type { LocalChatProps } from "./types";

export function LocalChat(props: LocalChatProps) {
  const state = useLocalChatModuleState();
  const actions = createLocalChatModuleActions(state, props.actions);
  const activeRequestRef = useRef(state.activeRequestId);
  const stopMessageRef = useRef(props.actions.stopMessage);
  activeRequestRef.current = state.activeRequestId;
  stopMessageRef.current = props.actions.stopMessage;

  useEffect(() => () => {
    const requestId = activeRequestRef.current;
    if (requestId) {
      void stopMessageRef.current(requestId).catch((error) => {
        console.error("离开对话页面时取消生成失败。", error);
      });
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RuntimeControl {...props} />
      <section aria-label="离线对话" className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatMessages state={state} />
        <ChatComposer actions={actions} disabled={props.state.runtime.status.state !== "ready"} state={state} />
      </section>
    </div>
  );
}

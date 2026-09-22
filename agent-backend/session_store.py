# -*- coding: utf-8 -*-
"""In-memory session store."""
import uuid
from time import time
from typing import Any
from dataclasses import dataclass, field


@dataclass
class ChatMessage:
    idx: int
    role: str       # "user" | "operator" | "agent"
    content: str
    ts: float = field(default_factory=time)

    def to_dict(self) -> dict:
        return {"idx": self.idx, "role": self.role, "content": self.content, "ts": self.ts}


@dataclass
class Session:
    session_id: str
    visitor_id: str | None = None
    user_type: str = "anonymous"        # anonymous / same_ip / lead / member
    member_id: str | None = None
    started_at: float = field(default_factory=time)
    human_serving: bool = False
    lead_submitted: bool = False
    lead_draft: dict[str, str] = field(default_factory=dict)
    agent: Any = None
    pending_ui: dict | None = None

    # Full conversation log (for polling + agent history injection)
    chat_log: list[ChatMessage] = field(default_factory=list)
    _msg_idx: int = field(default=0, init=False, repr=False)

    # Tracks how many chat_log entries have been injected into agent context
    # (used to inject operator messages when AI resumes)
    _injected_up_to: int = field(default=0, init=False, repr=False)

    # ── Rich turn log (for operator panel rendering) ─────────────────────────
    # Each entry: {seq, trace_id, trace_url, user_msg, user_msg_idx, thinking, tool_calls, agent_reply, special_events, quality_scores}
    # tool_calls: [{id, tool, args, result, type, data}]  type: normal|form_show|confirm_show|handoff
    turn_log: list[dict] = field(default_factory=list)
    # Manual quality reviews keyed by turn seq.
    quality_reviews: list[dict] = field(default_factory=list)

    # ── Analysis agent fields ────────────────────────────────────────────────
    # Latest structured output from AnalysisAgent
    analysis: dict | None = None
    # Latest 3 reply suggestions (populated when human_serving=True)
    suggested_replies: list[str] = field(default_factory=list)
    # AnalysisAgent instance (set by agent_runner when first message arrives)
    analysis_agent: Any = None
    # asyncio.Task for the background analysis loop
    analysis_task: Any = None
    # Set to True to stop the analysis loop when session is cleaned up
    _terminated: bool = field(default=False, init=False, repr=False)

    def add_message(self, role: str, content: str) -> ChatMessage:
        msg = ChatMessage(idx=self._msg_idx, role=role, content=content)
        self.chat_log.append(msg)
        self._msg_idx += 1
        return msg

    def messages_after(self, after_idx: int) -> list[dict]:
        return [m.to_dict() for m in self.chat_log if m.idx > after_idx]


class SessionStore:
    def __init__(self) -> None:
        self._store: dict[str, Session] = {}

    def create(
        self,
        visitor_id: str | None = None,
        user_type: str = "anonymous",
        member_id: str | None = None,
    ) -> Session:
        sid = uuid.uuid4().hex[:8]
        session = Session(
            session_id=sid,
            visitor_id=visitor_id,
            user_type=user_type,
            member_id=member_id,
        )
        self._store[sid] = session
        return session

    def get(self, session_id: str) -> Session | None:
        return self._store.get(session_id)

    def delete(self, session_id: str) -> None:
        self._store.pop(session_id, None)

    def all_sessions(self) -> list[Session]:
        return list(self._store.values())


store = SessionStore()

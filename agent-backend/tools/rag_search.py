# -*- coding: utf-8 -*-
"""RAG 工具：检索本站产品知识库。

使用关键词匹配搜索 knowledge/ 目录下的 Markdown 文件，返回相关段落。
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import asdict, dataclass
from pathlib import Path

from config import settings
from langfuse_tracing import (
    redact_payload,
    score_trace,
    start_observation_safe,
    trace_id_from_observation,
    update_observation_safe,
)

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"


@dataclass
class RagHit:
    doc_id: str
    doc_name: str
    paragraph_id: str
    score: int
    text: str


@dataclass
class RagSearchResult:
    query: str
    hits: list[RagHit]
    kb_version: str
    no_hit_reason: str | None = None


def _kb_version() -> str:
    """Return an explicit KB version or a stable hash of markdown file mtimes."""
    if settings.KB_VERSION:
        return settings.KB_VERSION
    digest = hashlib.sha1()
    for f in sorted(KNOWLEDGE_DIR.glob("*.md")):
        stat = f.stat()
        digest.update(f.name.encode("utf-8"))
        digest.update(str(int(stat.st_mtime)).encode("ascii"))
        digest.update(str(stat.st_size).encode("ascii"))
    return digest.hexdigest()[:12] if digest.digest() else "empty"


def _load_knowledge() -> dict[str, str]:
    """加载所有知识库文件，返回 {文件名: 内容} 字典。"""
    docs: dict[str, str] = {}
    for f in KNOWLEDGE_DIR.glob("*.md"):
        docs[f.stem] = f.read_text(encoding="utf-8")
    return docs


def _tokenize(text: str) -> list[str]:
    """提取搜索词：英文按 word 分词，中文逐字 + 2-gram。"""
    tokens: set[str] = set()
    # 英文/数字词
    for w in re.findall(r"[a-zA-Z0-9]+", text):
        tokens.add(w.lower())
    # 中文字符
    cjk = re.findall(r"[一-鿿]+", text)
    for seg in cjk:
        # 每个字
        for ch in seg:
            tokens.add(ch)
        # 2-gram
        for i in range(len(seg) - 1):
            tokens.add(seg[i:i+2])
        # 整段（短词语）
        if len(seg) <= 4:
            tokens.add(seg)
    return list(tokens)


def _score_paragraph(para: str, keywords: list[str]) -> int:
    """对段落按关键词命中数打分（大小写不敏感）。"""
    lower = para.lower()
    return sum(1 for kw in keywords if kw.lower() in lower)


def rag_search_structured(query: str) -> RagSearchResult:
    """Search product facts/pricing and return structured hits for observability."""
    kb_version = _kb_version()
    docs = _load_knowledge()
    if not docs:
        return RagSearchResult(
            query=query,
            hits=[],
            kb_version=kb_version,
            no_hit_reason="empty_knowledge_base",
        )

    keywords = _tokenize(query)
    if not keywords:
        return RagSearchResult(
            query=query,
            hits=[],
            kb_version=kb_version,
            no_hit_reason="empty_keywords",
        )

    results: list[tuple[int, str, int, str]] = []
    for doc_name, content in docs.items():
        # 按段落（双换行）分割
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        for idx, para in enumerate(paragraphs):
            score = _score_paragraph(para, keywords)
            if score > 0:
                results.append((score, doc_name, idx, para))

    if not results:
        return RagSearchResult(
            query=query,
            hits=[],
            kb_version=kb_version,
            no_hit_reason="no_matching_paragraph",
        )

    # 取评分最高的前 3 条
    results.sort(key=lambda x: x[0], reverse=True)
    top = results[:3]
    hits = [
        RagHit(
            doc_id=doc,
            doc_name=f"{doc}.md",
            paragraph_id=f"{doc}#{idx}",
            score=score,
            text=para[:400],
        )
        for score, doc, idx, para in top
    ]
    return RagSearchResult(query=query, hits=hits, kb_version=kb_version)


def format_rag_result(result: RagSearchResult) -> str:
    """Format structured RAG results back to the AgentScope tool contract."""
    if result.no_hit_reason == "empty_knowledge_base":
        return "知识库暂无内容，请直接回答用户问题。"
    if result.no_hit_reason == "empty_keywords":
        return "请提供更具体的搜索词。"
    if result.no_hit_reason:
        return f"知识库中未找到与「{result.query}」相关的内容，请尝试换个搜索词。"

    output_parts = [f"📚 知识库检索结果（查询：{result.query}）\n"]
    for hit in result.hits:
        output_parts.append(f"[{hit.doc_id}] {hit.text}")
    return "\n\n---\n\n".join(output_parts)


def rag_search(query: str) -> str:
    """Search the product knowledge base for product facts and pricing details."""
    observation = start_observation_safe(
        "rag_search",
        as_type="span",
        input={"query": query},
        metadata={"component": "knowledge_base", "kb_version": _kb_version()},
    )
    trace_id = trace_id_from_observation(observation)
    result = rag_search_structured(query)
    payload = {
        "query": result.query,
        "hit_count": len(result.hits),
        "hits": [asdict(hit) for hit in result.hits],
        "kb_version": result.kb_version,
        "no_hit_reason": result.no_hit_reason,
    }
    output = format_rag_result(result)
    update_observation_safe(
        observation,
        output=payload,
        metadata={
            "hit_count": len(result.hits),
            "kb_version": result.kb_version,
            "no_hit_reason": result.no_hit_reason,
        },
        end=True,
    )
    score_trace(
        trace_id,
        "rag_has_hit",
        1 if result.hits else 0,
        metadata=redact_payload({"query": query, "kb_version": result.kb_version}),
    )
    if result.no_hit_reason:
        score_trace(
            trace_id,
            "knowledge_gap",
            1,
            comment=result.no_hit_reason,
            metadata={"query": query, "kb_version": result.kb_version},
        )
    return output

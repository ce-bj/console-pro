# -*- coding: utf-8 -*-
"""Web 搜索工具：搜索平台以外的产品或解析用户分享的 URL。

支持两种模式：
1. URL 模式：直接 GET 请求，提取页面文本（适用于用户分享产品链接）
2. 关键词模式：通过 DuckDuckGo Lite 进行搜索
"""
import re
import httpx
from html.parser import HTMLParser


class _TextExtractor(HTMLParser):
    """极简 HTML 文本提取器（去除脚本/样式标签内容）。"""

    def __init__(self) -> None:
        super().__init__()
        self._skip = False
        self.texts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag in ("script", "style", "nav", "footer", "header"):
            self._skip = True

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style", "nav", "footer", "header"):
            self._skip = False

    def handle_data(self, data: str) -> None:
        if not self._skip and data.strip():
            self.texts.append(data.strip())


def _extract_text_from_html(html: str, max_chars: int = 1200) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    text = " ".join(parser.texts)
    text = re.sub(r"\s+", " ", text)
    return text[:max_chars]


async def _fetch_url(url: str) -> str:
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        return resp.text


async def _ddg_search(query: str) -> str:
    """DuckDuckGo Lite 文本搜索，无需 API key。"""
    url = "https://lite.duckduckgo.com/lite/"
    data = {"q": query, "kl": "cn-zh"}
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        resp = await client.post(url, data=data, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        return _extract_text_from_html(resp.text, max_chars=1500)


async def web_search(query: str) -> str:
    """Search the web for a product, URL, or image description the user shared.

    Use this tool when:
    - The user shares a URL (http/https link)
    - The user mentions a product or brand not in our knowledge base
    - The user uploads or describes a product image and asks if we carry it

    Args:
        query: A URL to fetch, or keywords / product name to search.

    Returns:
        Extracted text content from the URL or search results.
    """
    # 判断是否是 URL
    url_match = re.search(r"https?://\S+", query)
    if url_match:
        url = url_match.group(0)
        try:
            html = await _fetch_url(url)
            text = _extract_text_from_html(html, max_chars=1200)
            return f"🌐 页面内容（{url}）：\n{text}"
        except Exception as e:
            return f"无法获取页面 {url}：{e}。将改用关键词搜索。\n{await _ddg_search(query)}"

    # 关键词搜索
    try:
        result = await _ddg_search(query)
        return f"🔍 搜索结果（{query}）：\n{result}"
    except Exception as e:
        return f"搜索失败：{e}"

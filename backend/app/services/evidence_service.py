import os
import re
from typing import Optional


def parse_wechat_export(file_path: str) -> str:
    """Parse WeChat exported chat records (.txt format).

    Common WeChat export format:
    2024-01-15 10:30:22 昵称
    消息内容

    Returns parsed text with sender and content.
    """
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        raw = f.read()

    # Pattern: date time sender\ncontent
    pattern = r"(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)[\n\r]+(.+?)(?=\n\d{4}-\d{2}-\d{2}|\Z)"
    matches = re.findall(pattern, raw, re.DOTALL)

    if not matches:
        # Try alternate format: just return raw text
        return raw.strip()

    lines = []
    for timestamp, sender, content in matches:
        content = content.strip().replace("\n", " ")
        lines.append(f"[{timestamp}] {sender}: {content}")

    return "\n".join(lines)


def parse_html_wechat_export(file_path: str) -> str:
    """Parse WeChat HTML export. Basic extraction of text content."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        raw = f.read()

    # Remove HTML tags, extract text
    text = re.sub(r"<[^>]+>", "\n", raw)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_screenshot_text(file_path: str) -> str:
    """Placeholder for OCR parsing of screenshots.

    In production, this would use PaddleOCR or a cloud OCR API.
    For MVP, returns a placeholder message.
    """
    # TODO: Integrate PaddleOCR or cloud OCR
    return f"[截图文件: {os.path.basename(file_path)} — OCR 待处理]"


def parse_evidence_file(file_path: str, evidence_type: str) -> str:
    """Parse an evidence file based on its type."""
    if evidence_type == "screenshot":
        return parse_screenshot_text(file_path)

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".html":
        return parse_html_wechat_export(file_path)
    else:
        return parse_wechat_export(file_path)

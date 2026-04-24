import os
from typing import AsyncGenerator

import anthropic

from app.ai.base import AIProvider


class ClaudeProvider(AIProvider):
    """AI provider implementation using the Anthropic Claude API."""

    def __init__(self) -> None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
        self.max_tokens = int(os.getenv("CLAUDE_MAX_TOKENS", "4096"))

    async def stream_analysis(
        self, system_prompt: str, messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        """Stream analysis using Anthropic's streaming API."""
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def analyze(self, system_prompt: str, messages: list[dict]) -> str:
        """Non-streaming analysis using Anthropic's messages API."""
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

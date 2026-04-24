import os
from typing import AsyncGenerator

from openai import AsyncOpenAI

from app.ai.base import AIProvider


class OpenAIProvider(AIProvider):
    """AI provider implementation using the OpenAI API."""

    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "4096"))

    async def stream_analysis(
        self, system_prompt: str, messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        """Stream analysis using OpenAI's streaming API."""
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        stream = await self.client.chat.completions.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=formatted_messages,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content is not None:
                yield delta.content

    async def analyze(self, system_prompt: str, messages: list[dict]) -> str:
        """Non-streaming analysis using OpenAI's chat completions API."""
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages

        response = await self.client.chat.completions.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=formatted_messages,
        )
        return response.choices[0].message.content

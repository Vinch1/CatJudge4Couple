from abc import ABC, abstractmethod
from typing import AsyncGenerator


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    async def stream_analysis(
        self, system_prompt: str, messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        """Stream analysis output chunk by chunk.

        Args:
            system_prompt: The system prompt to set context.
            messages: A list of message dicts with 'role' and 'content' keys.

        Yields:
            Text chunks as they are generated.
        """
        ...

    @abstractmethod
    async def analyze(self, system_prompt: str, messages: list[dict]) -> str:
        """Non-streaming analysis. Returns the complete result.

        Args:
            system_prompt: The system prompt to set context.
            messages: A list of message dicts with 'role' and 'content' keys.

        Returns:
            The complete analysis text.
        """
        ...

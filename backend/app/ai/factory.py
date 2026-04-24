import os

from app.ai.base import AIProvider


def get_provider(provider_name: str | None = None) -> AIProvider:
    """Factory to create an AI provider based on name.

    Args:
        provider_name: Provider to use ("claude" or "openai").
            If not provided, reads from the AI_PROVIDER env var,
            defaulting to "claude".

    Returns:
        An instance of the requested AIProvider.

    Raises:
        ValueError: If the provider name is not recognized.
    """
    if provider_name is None:
        provider_name = os.getenv("AI_PROVIDER", "claude")

    if provider_name == "claude":
        from app.ai.claude_provider import ClaudeProvider

        return ClaudeProvider()
    elif provider_name == "openai":
        from app.ai.openai_provider import OpenAIProvider

        return OpenAIProvider()
    else:
        raise ValueError(f"Unknown AI provider: {provider_name}")

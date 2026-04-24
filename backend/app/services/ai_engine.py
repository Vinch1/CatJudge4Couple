from typing import AsyncGenerator

from app.ai.base import AIProvider
from app.ai.prompts.system import JUDGE_SYSTEM_PROMPT
from app.ai.prompts.trial import STAGE_PROMPTS, TRIAL_STAGES


def _build_evidence_block(
    plaintiff_evidence: list[str],
    defendant_evidence: list[str],
    plaintiff_name: str,
    defendant_name: str,
) -> str:
    """Build a formatted evidence block for the prompt."""
    block_parts: list[str] = []

    block_parts.append("── 原告方证据 ──")
    block_parts.append(f"原告：{plaintiff_name}\n")
    for i, evidence in enumerate(plaintiff_evidence, 1):
        block_parts.append(f"证据{i}：\n{evidence}\n")

    block_parts.append("── 被告方证据 ──")
    block_parts.append(f"被告：{defendant_name}\n")
    for i, evidence in enumerate(defendant_evidence, 1):
        block_parts.append(f"证据{i}：\n{evidence}\n")

    return "\n".join(block_parts)


class AIEngine:
    """Orchestrates the full trial pipeline using an AI provider."""

    def __init__(self, provider: AIProvider) -> None:
        self.provider = provider

    async def run_trial(
        self,
        plaintiff_evidence: list[str],
        defendant_evidence: list[str],
        plaintiff_name: str,
        defendant_name: str,
    ) -> AsyncGenerator[dict, None]:
        """Run the full trial pipeline, yielding stage updates and analysis chunks.

        Args:
            plaintiff_evidence: List of evidence text strings from the plaintiff.
            defendant_evidence: List of evidence text strings from the defendant.
            plaintiff_name: Name of the plaintiff.
            defendant_name: Name of the defendant.

        Yields:
            Dicts with type "stage_change", "analysis_chunk", or "verdict_complete".
        """
        evidence_block = _build_evidence_block(
            plaintiff_evidence, defendant_evidence, plaintiff_name, defendant_name
        )

        full_verdict_parts: list[str] = []

        for stage in TRIAL_STAGES:
            # Notify client that the stage has changed
            yield {"type": "stage_change", "stage": stage}

            # Build the stage-specific user message
            stage_template = STAGE_PROMPTS[stage]
            user_message = stage_template.format(
                evidence_block=evidence_block,
                plaintiff_name=plaintiff_name,
                defendant_name=defendant_name,
            )

            messages = [{"role": "user", "content": user_message}]

            # Stream analysis chunks for this stage
            stage_text_parts: list[str] = []
            async for chunk in self.provider.stream_analysis(
                JUDGE_SYSTEM_PROMPT, messages
            ):
                stage_text_parts.append(chunk)
                yield {
                    "type": "analysis_chunk",
                    "content": chunk,
                    "stage": stage,
                }

            full_verdict_parts.append("".join(stage_text_parts))

        # Final verdict — concatenate all stage outputs
        yield {
            "type": "verdict_complete",
            "verdict": "\n\n".join(full_verdict_parts),
        }

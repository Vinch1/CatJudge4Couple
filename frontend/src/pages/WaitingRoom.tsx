import { useParams, useSearchParams } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";

export default function WaitingRoom() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const role = searchParams.get("role") || "plaintiff";
  const { lastMessage, connected } = useWebSocket(caseId!, token);
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}/case/${caseId}/join`;

  useEffect(() => {
    if (lastMessage?.type === "stage_change") {
      window.location.href = `/case/${caseId}/courtroom?token=${token}&role=${role}`;
    }
  }, [lastMessage, caseId, token, role]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="max-w-md w-full px-6 text-center">
        <div className="text-5xl mb-6 animate-pulse">🐱‍⚖️</div>
        <h2 className="text-2xl font-bold text-white mb-2">法庭准备中</h2>
        <p className="text-[#888] mb-8">
          你的证据已提交，等待对方到场...
        </p>

        {/* Share link — only shown to plaintiff */}
        {role === "plaintiff" && (
          <div className="bg-[#1a1a2e] rounded-lg p-5 border border-[#ffd700]/30 mb-6">
            <div className="text-[#ffd700] text-sm font-bold mb-3">
              📜 将以下链接发送给被告
            </div>
            <div className="bg-[#0a0a0a] rounded px-3 py-2 text-white text-xs break-all text-left mb-3">
              {joinUrl}
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-2 bg-[#ffd700] text-black text-sm font-bold rounded hover:bg-[#e6c200] transition"
            >
              {copied ? "✓ 已复制" : "复制链接"}
            </button>
          </div>
        )}

        <div className="bg-[#1a1a2e] rounded-lg p-6 border border-[#2a2a4e] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#4ecdc4]">👤 原告</span>
            <span className={role === "plaintiff" ? "text-[#4ecdc4]" : "text-[#888]"}>
              {role === "plaintiff" ? "✓ 已就位" : "等待中..."}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#ff6b6b]">👤 被告</span>
            <span className={role === "defendant" ? "text-[#ff6b6b]" : "text-[#888]"}>
              {role === "defendant" ? "✓ 已就位" : "等待中..."}
            </span>
          </div>
        </div>

        <div className="mt-6 text-[#666] text-sm">
          {connected ? "🟢 已连接" : "🔴 连接中..."}
        </div>
      </div>
    </div>
  );
}

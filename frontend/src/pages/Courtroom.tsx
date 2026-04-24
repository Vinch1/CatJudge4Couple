import { useParams, useSearchParams } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { useEffect, useState, useRef } from "react";
import { getEvidences } from "../api";
import type { EvidenceInfo } from "../types";

const STAGE_LABELS: Record<string, string> = {
  evidence_review: "证据审查",
  fact_finding: "事实认定",
  law_application: "法条适用",
  verdict: "宣判",
};

export default function Courtroom() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const role = searchParams.get("role") || "plaintiff";
  const { lastMessage, connected } = useWebSocket(caseId!, token);

  const [currentStage, setCurrentStage] = useState("");
  const [judgeText, setJudgeText] = useState("");
  const [verdict, setVerdict] = useState("");
  const [evidences, setEvidences] = useState<EvidenceInfo[]>([]);
  const [popupRole, setPopupRole] = useState<"plaintiff" | "defendant" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (caseId) {
      getEvidences(caseId).then(setEvidences).catch(() => {});
    }
  }, [caseId]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "stage_change") {
      setCurrentStage(lastMessage.stage || "");
      setJudgeText("");
    }
    if (lastMessage.type === "analysis_chunk") {
      setJudgeText((prev) => prev + (lastMessage.content || ""));
    }
    if (lastMessage.type === "verdict_complete") {
      setVerdict(lastMessage.verdict || "");
    }
  }, [lastMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [judgeText]);

  const progress = currentStage
    ? Object.keys(STAGE_LABELS).indexOf(currentStage) /
      (Object.keys(STAGE_LABELS).length - 1)
    : 0;

  if (verdict) {
    window.location.href = `/case/${caseId}/verdict?token=${token}`;
  }

  const plaintiffEvidences = evidences.filter((e) => e.role === "plaintiff");
  const defendantEvidences = evidences.filter((e) => e.role === "defendant");
  const popupEvidences = popupRole === "plaintiff" ? plaintiffEvidences : defendantEvidences;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] px-6 py-3 flex items-center justify-between border-b-2 border-[#ffd700]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐱‍⚖️</span>
          <div>
            <div className="text-[#ffd700] font-bold">猫咪法庭 · 庭审中</div>
            <div className="text-[#888] text-xs">案件 #{caseId?.slice(0, 8)}</div>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          <button
            onClick={() => setPopupRole(popupRole === "plaintiff" ? null : "plaintiff")}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              popupRole === "plaintiff"
                ? "bg-[#4ecdc4]/20 text-[#4ecdc4] border border-[#4ecdc4]/50"
                : "bg-[#2a2a2a] text-[#4ecdc4] hover:bg-[#3a3a3a]"
            }`}
          >
            👤 原告证据 ●
          </button>
          <button
            onClick={() => setPopupRole(popupRole === "defendant" ? null : "defendant")}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              popupRole === "defendant"
                ? "bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/50"
                : "bg-[#2a2a2a] text-[#ff6b6b] hover:bg-[#3a3a3a]"
            }`}
          >
            👤 被告证据 ●
          </button>
      </div>

      {/* Evidence popup overlay */}
      {popupRole && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={() => setPopupRole(null)}>
          <div
            className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a4e]">
              <h3 className={`font-bold ${popupRole === "plaintiff" ? "text-[#4ecdc4]" : "text-[#ff6b6b]"}`}>
                {popupRole === "plaintiff" ? "👤 原告" : "👤 被告"}提交的证据
                <span className="text-[#888] text-xs font-normal ml-2">({popupEvidences.length} 份)</span>
              </h3>
              <button
                onClick={() => setPopupRole(null)}
                className="text-[#888] hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {popupEvidences.length === 0 ? (
                <div className="text-[#666] text-center py-8">暂无证据</div>
              ) : (
                popupEvidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-[#0a0a0a] rounded-lg p-4 border border-[#2a2a2a]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ev.evidence_type === "text"
                          ? "bg-[#ffd700]/10 text-[#ffd700]"
                          : ev.evidence_type === "wechat_export"
                          ? "bg-[#4ecdc4]/10 text-[#4ecdc4]"
                          : "bg-[#ff6b6b]/10 text-[#ff6b6b]"
                      }`}>
                        {ev.evidence_type === "text"
                          ? "✍️ 书面控诉"
                          : ev.evidence_type === "wechat_export"
                          ? "💬 微信记录"
                          : "📷 截图"}
                      </span>
                      <span className="text-[#666] text-xs">
                        {new Date(ev.created_at).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <div className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">
                      {ev.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>

      <div className="flex flex-1">
        {/* Evidence Panel (sidebar) */}
        <div className="w-72 border-r border-[#333] p-4 overflow-y-auto bg-[#0d0d0d]">
          <div className="text-[#888] text-xs uppercase tracking-wider mb-3">
            📋 证据材料
          </div>
          {evidences.map((ev) => (
            <div
              key={ev.id}
              className={`rounded-lg p-3 mb-2 border cursor-pointer hover:border-[#ffd700]/30 transition ${
                ev.role === "plaintiff"
                  ? "bg-[#1a2a1a] border-[#2a3a2a]"
                  : "bg-[#2a1a1a] border-[#3a2a2a]"
              }`}
              onClick={() => setPopupRole(ev.role)}
            >
              <div
                className={`text-xs font-bold ${
                  ev.role === "plaintiff" ? "text-[#4ecdc4]" : "text-[#ff6b6b]"
                }`}
              >
                {ev.role === "plaintiff" ? "原告" : "被告"}证据
              </div>
              <div className="text-white text-sm mt-1">
                {ev.evidence_type === "text"
                  ? "控诉陈述"
                  : ev.evidence_type === "wechat_export"
                  ? "微信聊天记录"
                  : "截图"}
              </div>
              <div className="text-[#666] text-xs mt-1">
                {ev.content?.slice(0, 50)}...
              </div>
            </div>
          ))}
        </div>

        {/* Judge Output */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-start gap-4">
              <div className="text-3xl min-w-[40px]">🐱‍⚖️</div>
              <div className="flex-1">
                <div className="text-[#ffd700] font-bold text-sm mb-2">
                  审判长 · 猫咪法官
                </div>
                <div className="bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg p-4 text-[#ddd] text-sm leading-relaxed whitespace-pre-wrap">
                  {judgeText || "等待开庭..."}
                  {!judgeText && currentStage && (
                    <span className="animate-pulse">▌</span>
                  )}
                </div>
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 border-t border-[#333] flex items-center gap-3">
            <div className="text-[#888] text-xs">审理进度</div>
            <div className="flex-1 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ffd700] to-[#ff6b6b] rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="text-[#ffd700] text-xs">
              {STAGE_LABELS[currentStage] || "准备中"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

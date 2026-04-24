import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getVerdict, getCase } from "../api";
import type { CaseInfo } from "../types";

export default function VerdictPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const [verdictText, setVerdictText] = useState("");
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    Promise.all([getVerdict(caseId), getCase(caseId)])
      .then(([verdict, c]) => {
        setVerdictText(verdict.content);
        setCaseInfo(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-4xl animate-pulse">🐱‍⚖️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f0] py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-8 py-6 text-center">
          <div className="text-4xl mb-2">🐱‍⚖️</div>
          <h1 className="text-2xl font-bold text-[#ffd700] tracking-[0.3em]">
            猫 咪 法 庭 判 决 书
          </h1>
          <div className="text-[#888] text-sm mt-1">
            （2024）猫法民初字第 {caseId?.slice(0, 6).toUpperCase()} 号
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="border-t-2 border-b-2 border-[#c9a84c] py-4 mb-6">
            <div className="text-[#333] font-bold mb-2">一、当事人</div>
            <div className="text-[#555] text-sm leading-8">
              原告：{caseInfo?.plaintiff_name}（以下简称"A"）
              <br />
              被告：{caseInfo?.defendant_name}（以下简称"B"）
              <br />
              案由：{caseInfo?.title}
            </div>
          </div>

          <div className="text-[#333] leading-8 text-sm whitespace-pre-wrap">
            {verdictText}
          </div>

          <div className="text-right mt-8 text-[#999] text-sm">
            审判长：猫咪法官 🐱‍⚖️
            <br />
            {new Date().toLocaleDateString("zh-CN")}
          </div>
        </div>
      </div>
    </div>
  );
}

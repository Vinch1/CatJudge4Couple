import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCase } from "../api";

export default function HomePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [plaintiffName, setPlaintiffName] = useState("");
  const [title, setTitle] = useState("");
  const [joinCaseId, setJoinCaseId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createCase(plaintiffName, title);
      navigate(`/case/${res.case.id}/evidence?token=${res.plaintiff_token}&role=plaintiff`);
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/case/${joinCaseId}/join`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="max-w-lg w-full px-6">
        {/* Brand */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🐱‍⚖️</div>
          <h1 className="text-4xl font-bold text-[#ffd700] tracking-widest mb-2">
            猫咪法庭
          </h1>
          <p className="text-[#888] text-sm">
            公正 · 严肃 · 基于证据的感情审判
          </p>
        </div>

        {mode === "home" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full py-4 bg-[#ffd700] text-black font-bold rounded-lg hover:bg-[#e6c200] transition text-lg"
            >
              ⚖️ 提起诉讼
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full py-4 bg-[#1a1a2e] text-[#ffd700] border border-[#ffd700]/30 font-bold rounded-lg hover:bg-[#1a1a2e]/80 transition text-lg"
            >
              📜 加入案件
            </button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[#888] text-sm mb-1">你的昵称（原告）</label>
              <input
                type="text"
                value={plaintiffName}
                onChange={(e) => setPlaintiffName(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#333] focus:border-[#ffd700] focus:outline-none"
                placeholder="请输入昵称"
                required
              />
            </div>
            <div>
              <label className="block text-[#888] text-sm mb-1">案由</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#333] focus:border-[#ffd700] focus:outline-none"
                placeholder="如：关于已读不回的纠纷"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:bg-[#e6c200] transition disabled:opacity-50"
            >
              {loading ? "创建中..." : "立案"}
            </button>
            <button
              type="button"
              onClick={() => setMode("home")}
              className="w-full py-2 text-[#888] hover:text-white transition"
            >
              返回
            </button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-[#888] text-sm mb-1">案件编号或链接</label>
              <input
                type="text"
                value={joinCaseId}
                onChange={(e) => setJoinCaseId(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#333] focus:border-[#ffd700] focus:outline-none"
                placeholder="输入案件链接"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:bg-[#e6c200] transition"
            >
              加入案件
            </button>
            <button
              type="button"
              onClick={() => setMode("home")}
              className="w-full py-2 text-[#888] hover:text-white transition"
            >
              返回
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

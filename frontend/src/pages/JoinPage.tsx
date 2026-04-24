import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { joinCase } from "../api";

export default function JoinPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [defendantName, setDefendantName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await joinCase(caseId, defendantName);
      navigate(
        `/case/${caseId}/evidence?token=${res.defendant_token}&role=defendant`
      );
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-2xl font-bold text-white">被告入场</h2>
          <p className="text-[#888] text-sm mt-2">你被传唤至猫咪法庭，请登记应诉</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-[#888] text-sm mb-1">你的昵称（被告）</label>
            <input
              type="text"
              value={defendantName}
              onChange={(e) => setDefendantName(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg border border-[#333] focus:border-[#ffd700] focus:outline-none"
              placeholder="请输入昵称"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#ff6b6b] text-white font-bold rounded-lg hover:bg-[#ff5252] transition disabled:opacity-50"
          >
            {loading ? "登记中..." : "登记应诉"}
          </button>
        </form>
      </div>
    </div>
  );
}

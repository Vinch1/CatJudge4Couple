import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { submitTextEvidence, submitFileEvidence } from "../api";

export default function EvidencePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const role = searchParams.get("role") || "plaintiff";

  const [textInput, setTextInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !textInput.trim()) return;
    setLoading(true);
    try {
      await submitTextEvidence(caseId, role, textInput);
      setSubmitted(true);
      navigate(`/case/${caseId}/waiting?token=${token}&role=${role}`);
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmitFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || files.length === 0) return;
    setLoading(true);
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const evidenceType =
          ext === "txt" || ext === "csv" || ext === "html"
            ? "wechat_export"
            : "screenshot";
        await submitFileEvidence(caseId, role, evidenceType, file);
      }
      setSubmitted(true);
      navigate(`/case/${caseId}/waiting?token=${token}&role=${role}`);
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="max-w-2xl w-full px-6">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="text-2xl font-bold text-white">提交证据</h2>
          <p className="text-[#888] text-sm mt-2">
            {role === "plaintiff" ? "原告" : "被告"}，请提交你的证据材料
          </p>
        </div>

        <div className="space-y-8">
          {/* Text input */}
          <div className="bg-[#1a1a2e] rounded-lg p-6 border border-[#2a2a4e]">
            <h3 className="text-[#ffd700] font-bold mb-3">✍️ 书面控诉</h3>
            <form onSubmit={handleSubmitText} className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full h-40 px-4 py-3 bg-[#0a0a0a] text-white rounded-lg border border-[#333] focus:border-[#ffd700] focus:outline-none resize-none"
                placeholder="请详细描述你的控诉内容..."
              />
              <button
                type="submit"
                disabled={loading || !textInput.trim()}
                className="w-full py-3 bg-[#ffd700] text-black font-bold rounded-lg hover:bg-[#e6c200] transition disabled:opacity-50"
              >
                提交控诉
              </button>
            </form>
          </div>

          {/* File upload */}
          <div className="bg-[#1a1a2e] rounded-lg p-6 border border-[#2a2a4e]">
            <h3 className="text-[#ffd700] font-bold mb-3">📎 上传文件</h3>
            <form onSubmit={handleSubmitFiles} className="space-y-3">
              <div className="border-2 border-dashed border-[#333] rounded-lg p-8 text-center hover:border-[#ffd700]/50 transition">
                <input
                  type="file"
                  multiple
                  accept=".txt,.csv,.html,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-[#888]">
                    {files.length > 0 ? (
                      <div className="text-white">
                        {files.map((f) => f.name).join(", ")}
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl mb-2">📁</div>
                        <p>点击或拖拽上传</p>
                        <p className="text-xs mt-1">
                          支持 .txt / .csv / .html（微信导出）和 .png / .jpg（截图）
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || files.length === 0}
                className="w-full py-3 bg-[#4ecdc4] text-black font-bold rounded-lg hover:bg-[#3dbdb5] transition disabled:opacity-50"
              >
                提交文件证据
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

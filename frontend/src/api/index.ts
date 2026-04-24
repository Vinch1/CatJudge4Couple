import type {
  CaseInfo,
  CaseCreateResponse,
  CaseJoinResponse,
  EvidenceInfo,
} from "../types";

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export async function createCase(
  plaintiff_name: string,
  title: string
): Promise<CaseCreateResponse> {
  return request("/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plaintiff_name, title }),
  });
}

export async function joinCase(
  caseId: string,
  defendant_name: string
): Promise<CaseJoinResponse> {
  return request(`/cases/${caseId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defendant_name }),
  });
}

export async function getCase(caseId: string): Promise<CaseInfo> {
  return request(`/cases/${caseId}`);
}

export async function submitTextEvidence(
  caseId: string,
  role: string,
  content: string
): Promise<EvidenceInfo> {
  const form = new FormData();
  form.append("role", role);
  form.append("evidence_type", "text");
  form.append("content", content);
  return request(`/cases/${caseId}/evidence`, {
    method: "POST",
    body: form,
  });
}

export async function submitFileEvidence(
  caseId: string,
  role: string,
  evidenceType: string,
  file: File
): Promise<EvidenceInfo> {
  const form = new FormData();
  form.append("role", role);
  form.append("evidence_type", evidenceType);
  form.append("file", file);
  return request(`/cases/${caseId}/evidence`, {
    method: "POST",
    body: form,
  });
}

export async function getEvidences(caseId: string): Promise<EvidenceInfo[]> {
  return request(`/cases/${caseId}/evidences`);
}

export async function getVerdict(
  caseId: string
): Promise<{ content: string }> {
  return request(`/cases/${caseId}/verdict`);
}

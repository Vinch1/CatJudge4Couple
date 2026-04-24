export type CaseStatus =
  | "waiting_plaintiff"
  | "waiting_defendant"
  | "both_ready"
  | "in_session"
  | "verdict";

export interface CaseInfo {
  id: string;
  status: CaseStatus;
  plaintiff_name: string;
  defendant_name: string | null;
  title: string;
  created_at: string;
}

export interface CaseCreateResponse {
  case: CaseInfo;
  plaintiff_token: string;
}

export interface CaseJoinResponse {
  case: CaseInfo;
  defendant_token: string;
}

export type EvidenceRole = "plaintiff" | "defendant";
export type EvidenceType = "wechat_export" | "screenshot" | "text";

export interface EvidenceInfo {
  id: string;
  case_id: string;
  role: EvidenceRole;
  evidence_type: EvidenceType;
  content: string;
  created_at: string;
}

export interface WsMessage {
  type:
    | "stage_change"
    | "analysis_chunk"
    | "verdict_complete"
    | "participant_status"
    | "heartbeat"
  stage?: string;
  content?: string;
  verdict?: string;
  plaintiff_connected?: boolean;
  defendant_connected?: boolean;
}

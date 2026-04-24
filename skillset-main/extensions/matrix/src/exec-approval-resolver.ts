import { resolveApprovalOverGateway } from "skillset/plugin-sdk/approval-gateway-runtime";
import type { ExecApprovalReplyDecision } from "skillset/plugin-sdk/approval-runtime";
import type { SkillSetConfig } from "skillset/plugin-sdk/config-runtime";
import { isApprovalNotFoundError } from "skillset/plugin-sdk/error-runtime";

export { isApprovalNotFoundError };

export async function resolveMatrixApproval(params: {
  cfg: SkillSetConfig;
  approvalId: string;
  decision: ExecApprovalReplyDecision;
  senderId?: string | null;
  gatewayUrl?: string;
}): Promise<void> {
  await resolveApprovalOverGateway({
    cfg: params.cfg,
    approvalId: params.approvalId,
    decision: params.decision,
    senderId: params.senderId,
    gatewayUrl: params.gatewayUrl,
    clientDisplayName: `Matrix approval (${params.senderId?.trim() || "unknown"})`,
  });
}

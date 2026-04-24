import Foundation

public enum SkillSetWatchCommand: String, Codable, Sendable {
    case status = "watch.status"
    case notify = "watch.notify"
}

public enum SkillSetWatchPayloadType: String, Codable, Sendable, Equatable {
    case notify = "watch.notify"
    case reply = "watch.reply"
    case execApprovalPrompt = "watch.execApproval.prompt"
    case execApprovalResolve = "watch.execApproval.resolve"
    case execApprovalResolved = "watch.execApproval.resolved"
    case execApprovalExpired = "watch.execApproval.expired"
    case execApprovalSnapshot = "watch.execApproval.snapshot"
    case execApprovalSnapshotRequest = "watch.execApproval.snapshotRequest"
}

public enum SkillSetWatchRisk: String, Codable, Sendable, Equatable {
    case low
    case medium
    case high
}

public enum SkillSetWatchExecApprovalDecision: String, Codable, Sendable, Equatable {
    case allowOnce = "allow-once"
    case deny
}

public enum SkillSetWatchExecApprovalCloseReason: String, Codable, Sendable, Equatable {
    case expired
    case notFound = "not-found"
    case unavailable
    case replaced
    case resolved
}

public struct SkillSetWatchAction: Codable, Sendable, Equatable {
    public var id: String
    public var label: String
    public var style: String?

    public init(id: String, label: String, style: String? = nil) {
        self.id = id
        self.label = label
        self.style = style
    }
}

public struct SkillSetWatchExecApprovalItem: Codable, Sendable, Equatable, Identifiable {
    public var id: String
    public var commandText: String
    public var commandPreview: String?
    public var host: String?
    public var nodeId: String?
    public var agentId: String?
    public var expiresAtMs: Int?
    public var allowedDecisions: [SkillSetWatchExecApprovalDecision]
    public var risk: SkillSetWatchRisk?

    public init(
        id: String,
        commandText: String,
        commandPreview: String? = nil,
        host: String? = nil,
        nodeId: String? = nil,
        agentId: String? = nil,
        expiresAtMs: Int? = nil,
        allowedDecisions: [SkillSetWatchExecApprovalDecision] = [],
        risk: SkillSetWatchRisk? = nil)
    {
        self.id = id
        self.commandText = commandText
        self.commandPreview = commandPreview
        self.host = host
        self.nodeId = nodeId
        self.agentId = agentId
        self.expiresAtMs = expiresAtMs
        self.allowedDecisions = allowedDecisions
        self.risk = risk
    }
}

public struct SkillSetWatchExecApprovalPromptMessage: Codable, Sendable, Equatable {
    public var type: SkillSetWatchPayloadType
    public var approval: SkillSetWatchExecApprovalItem
    public var sentAtMs: Int?
    public var deliveryId: String?
    public var resetResolvingState: Bool?

    public init(
        approval: SkillSetWatchExecApprovalItem,
        sentAtMs: Int? = nil,
        deliveryId: String? = nil,
        resetResolvingState: Bool? = nil)
    {
        self.type = .execApprovalPrompt
        self.approval = approval
        self.sentAtMs = sentAtMs
        self.deliveryId = deliveryId
        self.resetResolvingState = resetResolvingState
    }
}

public struct SkillSetWatchExecApprovalResolveMessage: Codable, Sendable, Equatable {
    public var type: SkillSetWatchPayloadType
    public var approvalId: String
    public var decision: SkillSetWatchExecApprovalDecision
    public var replyId: String
    public var sentAtMs: Int?

    public init(
        approvalId: String,
        decision: SkillSetWatchExecApprovalDecision,
        replyId: String,
        sentAtMs: Int? = nil)
    {
        self.type = .execApprovalResolve
        self.approvalId = approvalId
        self.decision = decision
        self.replyId = replyId
        self.sentAtMs = sentAtMs
    }
}

public struct SkillSetWatchExecApprovalResolvedMessage: Codable, Sendable, Equatable {
    public var type: SkillSetWatchPayloadType
    public var approvalId: String
    public var decision: SkillSetWatchExecApprovalDecision?
    public var resolvedAtMs: Int?
    public var source: String?

    public init(
        approvalId: String,
        decision: SkillSetWatchExecApprovalDecision? = nil,
        resolvedAtMs: Int? = nil,
        source: String? = nil)
    {
        self.type = .execApprovalResolved
        self.approvalId = approvalId
        self.decision = decision
        self.resolvedAtMs = resolvedAtMs
        self.source = source
    }
}

public struct SkillSetWatchExecApprovalExpiredMessage: Codable, Sendable, Equatable {
    public var type: SkillSetWatchPayloadType
    public var approvalId: String
    public var reason: SkillSetWatchExecApprovalCloseReason
    public var expiredAtMs: Int?

    public init(
        approvalId: String,
        reason: SkillSetWatchExecApprovalCloseReason,
        expiredAtMs: Int? = nil)
    {
        self.type = .execApprovalExpired
        self.approvalId = approvalId
        self.reason = reason
        self.expiredAtMs = expiredAtMs
    }
}

public struct SkillSetWatchExecApprovalSnapshotMessage: Codable, Sendable, Equatable {
    public var type: SkillSetWatchPayloadType
    public var approvals: [SkillSetWatchExecApprovalItem]
    public var sentAtMs: Int?
    public var snapshotId: String?

    public init(
        approvals: [SkillSetWatchExecApprovalItem],
        sentAtMs: Int? = nil,
        snapshotId: String? = nil)
    {
        self.type = .execApprovalSnapshot
        self.approvals = approvals
        self.sentAtMs = sentAtMs
        self.snapshotId = snapshotId
    }
}

public struct SkillSetWatchExecApprovalSnapshotRequestMessage: Codable, Sendable, Equatable {
    public var type: SkillSetWatchPayloadType
    public var requestId: String
    public var sentAtMs: Int?

    public init(requestId: String, sentAtMs: Int? = nil) {
        self.type = .execApprovalSnapshotRequest
        self.requestId = requestId
        self.sentAtMs = sentAtMs
    }
}

public struct SkillSetWatchStatusPayload: Codable, Sendable, Equatable {
    public var supported: Bool
    public var paired: Bool
    public var appInstalled: Bool
    public var reachable: Bool
    public var activationState: String

    public init(
        supported: Bool,
        paired: Bool,
        appInstalled: Bool,
        reachable: Bool,
        activationState: String)
    {
        self.supported = supported
        self.paired = paired
        self.appInstalled = appInstalled
        self.reachable = reachable
        self.activationState = activationState
    }
}

public struct SkillSetWatchNotifyParams: Codable, Sendable, Equatable {
    public var title: String
    public var body: String
    public var priority: SkillSetNotificationPriority?
    public var promptId: String?
    public var sessionKey: String?
    public var kind: String?
    public var details: String?
    public var expiresAtMs: Int?
    public var risk: SkillSetWatchRisk?
    public var actions: [SkillSetWatchAction]?

    public init(
        title: String,
        body: String,
        priority: SkillSetNotificationPriority? = nil,
        promptId: String? = nil,
        sessionKey: String? = nil,
        kind: String? = nil,
        details: String? = nil,
        expiresAtMs: Int? = nil,
        risk: SkillSetWatchRisk? = nil,
        actions: [SkillSetWatchAction]? = nil)
    {
        self.title = title
        self.body = body
        self.priority = priority
        self.promptId = promptId
        self.sessionKey = sessionKey
        self.kind = kind
        self.details = details
        self.expiresAtMs = expiresAtMs
        self.risk = risk
        self.actions = actions
    }
}

public struct SkillSetWatchNotifyPayload: Codable, Sendable, Equatable {
    public var deliveredImmediately: Bool
    public var queuedForDelivery: Bool
    public var transport: String

    public init(deliveredImmediately: Bool, queuedForDelivery: Bool, transport: String) {
        self.deliveredImmediately = deliveredImmediately
        self.queuedForDelivery = queuedForDelivery
        self.transport = transport
    }
}

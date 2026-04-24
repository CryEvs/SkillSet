import CoreLocation
import Foundation
import SkillSetKit
import UIKit

typealias SkillSetCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias SkillSetCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: SkillSetCameraSnapParams) async throws -> SkillSetCameraSnapResult
    func clip(params: SkillSetCameraClipParams) async throws -> SkillSetCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: SkillSetLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: SkillSetLocationGetParams,
        desiredAccuracy: SkillSetLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: SkillSetLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> SkillSetDeviceStatusPayload
    func info() -> SkillSetDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: SkillSetPhotosLatestParams) async throws -> SkillSetPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: SkillSetContactsSearchParams) async throws -> SkillSetContactsSearchPayload
    func add(params: SkillSetContactsAddParams) async throws -> SkillSetContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: SkillSetCalendarEventsParams) async throws -> SkillSetCalendarEventsPayload
    func add(params: SkillSetCalendarAddParams) async throws -> SkillSetCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: SkillSetRemindersListParams) async throws -> SkillSetRemindersListPayload
    func add(params: SkillSetRemindersAddParams) async throws -> SkillSetRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: SkillSetMotionActivityParams) async throws -> SkillSetMotionActivityPayload
    func pedometer(params: SkillSetPedometerParams) async throws -> SkillSetPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchExecApprovalResolveEvent: Sendable, Equatable {
    var replyId: String
    var approvalId: String
    var decision: SkillSetWatchExecApprovalDecision
    var sentAtMs: Int?
    var transport: String
}

struct WatchExecApprovalSnapshotRequestEvent: Sendable, Equatable {
    var requestId: String
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setStatusHandler(_ handler: (@Sendable (WatchMessagingStatus) -> Void)?)
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func setExecApprovalResolveHandler(_ handler: (@Sendable (WatchExecApprovalResolveEvent) -> Void)?)
    func setExecApprovalSnapshotRequestHandler(
        _ handler: (@Sendable (WatchExecApprovalSnapshotRequestEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: SkillSetWatchNotifyParams) async throws -> WatchNotificationSendResult
    func sendExecApprovalPrompt(
        _ message: SkillSetWatchExecApprovalPromptMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalResolved(
        _ message: SkillSetWatchExecApprovalResolvedMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalExpired(
        _ message: SkillSetWatchExecApprovalExpiredMessage) async throws -> WatchNotificationSendResult
    func syncExecApprovalSnapshot(
        _ message: SkillSetWatchExecApprovalSnapshotMessage) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}

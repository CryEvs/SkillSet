import Foundation

public enum SkillSetDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum SkillSetBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum SkillSetThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum SkillSetNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum SkillSetNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct SkillSetBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: SkillSetBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: SkillSetBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct SkillSetThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: SkillSetThermalState

    public init(state: SkillSetThermalState) {
        self.state = state
    }
}

public struct SkillSetStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct SkillSetNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: SkillSetNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [SkillSetNetworkInterfaceType]

    public init(
        status: SkillSetNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [SkillSetNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct SkillSetDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: SkillSetBatteryStatusPayload
    public var thermal: SkillSetThermalStatusPayload
    public var storage: SkillSetStorageStatusPayload
    public var network: SkillSetNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: SkillSetBatteryStatusPayload,
        thermal: SkillSetThermalStatusPayload,
        storage: SkillSetStorageStatusPayload,
        network: SkillSetNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct SkillSetDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}

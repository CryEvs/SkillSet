import Foundation

public enum SkillSetCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum SkillSetCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum SkillSetCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum SkillSetCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct SkillSetCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: SkillSetCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: SkillSetCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: SkillSetCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: SkillSetCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct SkillSetCameraClipParams: Codable, Sendable, Equatable {
    public var facing: SkillSetCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: SkillSetCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: SkillSetCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: SkillSetCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}

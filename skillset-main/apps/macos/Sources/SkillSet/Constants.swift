import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-skillset writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.skillset.mac"
let gatewayLaunchdLabel = "ai.skillset.gateway"
let onboardingVersionKey = "skillset.onboardingVersion"
let onboardingSeenKey = "skillset.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "skillset.pauseEnabled"
let iconAnimationsEnabledKey = "skillset.iconAnimationsEnabled"
let swabbleEnabledKey = "skillset.swabbleEnabled"
let swabbleTriggersKey = "skillset.swabbleTriggers"
let voiceWakeTriggerChimeKey = "skillset.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "skillset.voiceWakeSendChime"
let showDockIconKey = "skillset.showDockIcon"
let defaultVoiceWakeTriggers = ["skillset"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "skillset.voiceWakeMicID"
let voiceWakeMicNameKey = "skillset.voiceWakeMicName"
let voiceWakeLocaleKey = "skillset.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "skillset.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "skillset.voicePushToTalkEnabled"
let voiceWakeTriggersTalkModeKey = "skillset.voiceWakeTriggersTalkMode"
let talkEnabledKey = "skillset.talkEnabled"
let iconOverrideKey = "skillset.iconOverride"
let connectionModeKey = "skillset.connectionMode"
let remoteTargetKey = "skillset.remoteTarget"
let remoteIdentityKey = "skillset.remoteIdentity"
let remoteProjectRootKey = "skillset.remoteProjectRoot"
let remoteCliPathKey = "skillset.remoteCliPath"
let canvasEnabledKey = "skillset.canvasEnabled"
let cameraEnabledKey = "skillset.cameraEnabled"
let systemRunPolicyKey = "skillset.systemRunPolicy"
let systemRunAllowlistKey = "skillset.systemRunAllowlist"
let systemRunEnabledKey = "skillset.systemRunEnabled"
let locationModeKey = "skillset.locationMode"
let locationPreciseKey = "skillset.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "skillset.peekabooBridgeEnabled"
let deepLinkKeyKey = "skillset.deepLinkKey"
let modelCatalogPathKey = "skillset.modelCatalogPath"
let modelCatalogReloadKey = "skillset.modelCatalogReload"
let cliInstallPromptedVersionKey = "skillset.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "skillset.heartbeatsEnabled"
let debugPaneEnabledKey = "skillset.debugPaneEnabled"
let debugFileLogEnabledKey = "skillset.debug.fileLogEnabled"
let appLogLevelKey = "skillset.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26

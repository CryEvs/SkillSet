// swift-tools-version: 6.2
// Package manifest for the SkillSet macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "SkillSet",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "SkillSetIPC", targets: ["SkillSetIPC"]),
        .library(name: "SkillSetDiscovery", targets: ["SkillSetDiscovery"]),
        .executable(name: "SkillSet", targets: ["SkillSet"]),
        .executable(name: "skillset-mac", targets: ["SkillSetMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.3.0"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.4.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.10.1"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.9.0"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/SkillSetKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "SkillSetIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "SkillSetDiscovery",
            dependencies: [
                .product(name: "SkillSetKit", package: "SkillSetKit"),
            ],
            path: "Sources/SkillSetDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "SkillSet",
            dependencies: [
                "SkillSetIPC",
                "SkillSetDiscovery",
                .product(name: "SkillSetKit", package: "SkillSetKit"),
                .product(name: "SkillSetChatUI", package: "SkillSetKit"),
                .product(name: "SkillSetProtocol", package: "SkillSetKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/SkillSet.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "SkillSetMacCLI",
            dependencies: [
                "SkillSetDiscovery",
                .product(name: "SkillSetKit", package: "SkillSetKit"),
                .product(name: "SkillSetProtocol", package: "SkillSetKit"),
            ],
            path: "Sources/SkillSetMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "SkillSetIPCTests",
            dependencies: [
                "SkillSetIPC",
                "SkillSet",
                "SkillSetDiscovery",
                .product(name: "SkillSetProtocol", package: "SkillSetKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])

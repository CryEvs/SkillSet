// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "SkillSetKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "SkillSetProtocol", targets: ["SkillSetProtocol"]),
        .library(name: "SkillSetKit", targets: ["SkillSetKit"]),
        .library(name: "SkillSetChatUI", targets: ["SkillSetChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "SkillSetProtocol",
            path: "Sources/SkillSetProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "SkillSetKit",
            dependencies: [
                "SkillSetProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/SkillSetKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "SkillSetChatUI",
            dependencies: [
                "SkillSetKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/SkillSetChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "SkillSetKitTests",
            dependencies: ["SkillSetKit", "SkillSetChatUI"],
            path: "Tests/SkillSetKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])

import Foundation
import Testing
@testable import SkillSet

@Suite(.serialized) struct NodeServiceManagerTests {
    @Test func `builds node service commands with current CLI shape`() async throws {
        try await TestIsolation.withUserDefaultsValues(["skillset.gatewayProjectRootPath": nil]) {
            let tmp = try makeTempDirForTests()
            CommandResolver.setProjectRoot(tmp.path)

            let skillsetPath = tmp.appendingPathComponent("node_modules/.bin/skillset")
            try makeExecutableForTests(at: skillsetPath)

            let start = NodeServiceManager._testServiceCommand(["start"])
            #expect(start == [skillsetPath.path, "node", "start", "--json"])

            let stop = NodeServiceManager._testServiceCommand(["stop"])
            #expect(stop == [skillsetPath.path, "node", "stop", "--json"])
        }
    }
}

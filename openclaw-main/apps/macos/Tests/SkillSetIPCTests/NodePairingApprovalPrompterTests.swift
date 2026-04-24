import Testing
@testable import SkillSet

@Suite(.serialized)
@MainActor
struct NodePairingApprovalPrompterTests {
    @Test func `node pairing approval prompter exercises`() async {
        await NodePairingApprovalPrompter.exerciseForTesting()
    }
}

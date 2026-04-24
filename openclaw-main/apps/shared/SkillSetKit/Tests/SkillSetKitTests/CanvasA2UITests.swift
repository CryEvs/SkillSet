import SkillSetKit
import Testing

@Suite struct CanvasA2UITests {
    @Test func commandStringsAreStable() {
        #expect(SkillSetCanvasA2UICommand.push.rawValue == "canvas.a2ui.push")
        #expect(SkillSetCanvasA2UICommand.pushJSONL.rawValue == "canvas.a2ui.pushJSONL")
        #expect(SkillSetCanvasA2UICommand.reset.rawValue == "canvas.a2ui.reset")
    }

    @Test func jsonlDecodesAndValidatesV0_8() throws {
        let jsonl = """
        {"beginRendering":{"surfaceId":"main","timestamp":1}}
        {"surfaceUpdate":{"surfaceId":"main","ops":[]}}
        {"dataModelUpdate":{"dataModel":{"title":"Hello"}}}
        {"deleteSurface":{"surfaceId":"main"}}
        """

        let messages = try SkillSetCanvasA2UIJSONL.decodeMessagesFromJSONL(jsonl)
        #expect(messages.count == 4)
    }

    @Test func jsonlRejectsV0_9CreateSurface() {
        let jsonl = """
        {"createSurface":{"surfaceId":"main"}}
        """

        #expect(throws: Error.self) {
            _ = try SkillSetCanvasA2UIJSONL.decodeMessagesFromJSONL(jsonl)
        }
    }

    @Test func jsonlRejectsUnknownShape() {
        let jsonl = """
        {"wat":{"nope":1}}
        """

        #expect(throws: Error.self) {
            _ = try SkillSetCanvasA2UIJSONL.decodeMessagesFromJSONL(jsonl)
        }
    }
}

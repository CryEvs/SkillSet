import Testing
@testable import SkillSet

@Suite(.serialized) struct SkillSetAppDelegateTests {
    @Test @MainActor func resolvesRegistryModelBeforeViewTaskAssignsDelegateModel() {
        let registryModel = NodeAppModel()
        SkillSetAppModelRegistry.appModel = registryModel
        defer { SkillSetAppModelRegistry.appModel = nil }

        let delegate = SkillSetAppDelegate()

        #expect(delegate._test_resolvedAppModel() === registryModel)
    }

    @Test @MainActor func prefersExplicitDelegateModelOverRegistryFallback() {
        let registryModel = NodeAppModel()
        let explicitModel = NodeAppModel()
        SkillSetAppModelRegistry.appModel = registryModel
        defer { SkillSetAppModelRegistry.appModel = nil }

        let delegate = SkillSetAppDelegate()
        delegate.appModel = explicitModel

        #expect(delegate._test_resolvedAppModel() === explicitModel)
    }
}

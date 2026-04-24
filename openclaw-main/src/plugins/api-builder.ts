import type { SkillSetConfig } from "../config/types.skillset.js";
import type { PluginRuntime } from "./runtime/types.js";
import type { SkillSetPluginApi, PluginLogger } from "./types.js";

export type BuildPluginApiParams = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  rootDir?: string;
  registrationMode: SkillSetPluginApi["registrationMode"];
  config: SkillSetConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  resolvePath: (input: string) => string;
  handlers?: Partial<
    Pick<
      SkillSetPluginApi,
      | "registerTool"
      | "registerHook"
      | "registerHttpRoute"
      | "registerChannel"
      | "registerGatewayMethod"
      | "registerCli"
      | "registerReload"
      | "registerNodeHostCommand"
      | "registerSecurityAuditCollector"
      | "registerService"
      | "registerCliBackend"
      | "registerTextTransforms"
      | "registerConfigMigration"
      | "registerAutoEnableProbe"
      | "registerProvider"
      | "registerSpeechProvider"
      | "registerRealtimeTranscriptionProvider"
      | "registerRealtimeVoiceProvider"
      | "registerMediaUnderstandingProvider"
      | "registerImageGenerationProvider"
      | "registerVideoGenerationProvider"
      | "registerMusicGenerationProvider"
      | "registerWebFetchProvider"
      | "registerWebSearchProvider"
      | "registerInteractiveHandler"
      | "onConversationBindingResolved"
      | "registerCommand"
      | "registerContextEngine"
      | "registerCompactionProvider"
      | "registerAgentHarness"
      | "registerEmbeddedExtensionFactory"
      | "registerCodexAppServerExtensionFactory"
      | "registerDetachedTaskRuntime"
      | "registerMemoryCapability"
      | "registerMemoryPromptSection"
      | "registerMemoryPromptSupplement"
      | "registerMemoryCorpusSupplement"
      | "registerMemoryFlushPlan"
      | "registerMemoryRuntime"
      | "registerMemoryEmbeddingProvider"
      | "on"
    >
  >;
};

const noopRegisterTool: SkillSetPluginApi["registerTool"] = () => {};
const noopRegisterHook: SkillSetPluginApi["registerHook"] = () => {};
const noopRegisterHttpRoute: SkillSetPluginApi["registerHttpRoute"] = () => {};
const noopRegisterChannel: SkillSetPluginApi["registerChannel"] = () => {};
const noopRegisterGatewayMethod: SkillSetPluginApi["registerGatewayMethod"] = () => {};
const noopRegisterCli: SkillSetPluginApi["registerCli"] = () => {};
const noopRegisterReload: SkillSetPluginApi["registerReload"] = () => {};
const noopRegisterNodeHostCommand: SkillSetPluginApi["registerNodeHostCommand"] = () => {};
const noopRegisterSecurityAuditCollector: SkillSetPluginApi["registerSecurityAuditCollector"] =
  () => {};
const noopRegisterService: SkillSetPluginApi["registerService"] = () => {};
const noopRegisterCliBackend: SkillSetPluginApi["registerCliBackend"] = () => {};
const noopRegisterTextTransforms: SkillSetPluginApi["registerTextTransforms"] = () => {};
const noopRegisterConfigMigration: SkillSetPluginApi["registerConfigMigration"] = () => {};
const noopRegisterAutoEnableProbe: SkillSetPluginApi["registerAutoEnableProbe"] = () => {};
const noopRegisterProvider: SkillSetPluginApi["registerProvider"] = () => {};
const noopRegisterSpeechProvider: SkillSetPluginApi["registerSpeechProvider"] = () => {};
const noopRegisterRealtimeTranscriptionProvider: SkillSetPluginApi["registerRealtimeTranscriptionProvider"] =
  () => {};
const noopRegisterRealtimeVoiceProvider: SkillSetPluginApi["registerRealtimeVoiceProvider"] =
  () => {};
const noopRegisterMediaUnderstandingProvider: SkillSetPluginApi["registerMediaUnderstandingProvider"] =
  () => {};
const noopRegisterImageGenerationProvider: SkillSetPluginApi["registerImageGenerationProvider"] =
  () => {};
const noopRegisterVideoGenerationProvider: SkillSetPluginApi["registerVideoGenerationProvider"] =
  () => {};
const noopRegisterMusicGenerationProvider: SkillSetPluginApi["registerMusicGenerationProvider"] =
  () => {};
const noopRegisterWebFetchProvider: SkillSetPluginApi["registerWebFetchProvider"] = () => {};
const noopRegisterWebSearchProvider: SkillSetPluginApi["registerWebSearchProvider"] = () => {};
const noopRegisterInteractiveHandler: SkillSetPluginApi["registerInteractiveHandler"] = () => {};
const noopOnConversationBindingResolved: SkillSetPluginApi["onConversationBindingResolved"] =
  () => {};
const noopRegisterCommand: SkillSetPluginApi["registerCommand"] = () => {};
const noopRegisterContextEngine: SkillSetPluginApi["registerContextEngine"] = () => {};
const noopRegisterCompactionProvider: SkillSetPluginApi["registerCompactionProvider"] = () => {};
const noopRegisterAgentHarness: SkillSetPluginApi["registerAgentHarness"] = () => {};
const noopRegisterEmbeddedExtensionFactory: SkillSetPluginApi["registerEmbeddedExtensionFactory"] =
  () => {};
const noopRegisterCodexAppServerExtensionFactory: SkillSetPluginApi["registerCodexAppServerExtensionFactory"] =
  () => {};
const noopRegisterDetachedTaskRuntime: SkillSetPluginApi["registerDetachedTaskRuntime"] = () => {};
const noopRegisterMemoryCapability: SkillSetPluginApi["registerMemoryCapability"] = () => {};
const noopRegisterMemoryPromptSection: SkillSetPluginApi["registerMemoryPromptSection"] = () => {};
const noopRegisterMemoryPromptSupplement: SkillSetPluginApi["registerMemoryPromptSupplement"] =
  () => {};
const noopRegisterMemoryCorpusSupplement: SkillSetPluginApi["registerMemoryCorpusSupplement"] =
  () => {};
const noopRegisterMemoryFlushPlan: SkillSetPluginApi["registerMemoryFlushPlan"] = () => {};
const noopRegisterMemoryRuntime: SkillSetPluginApi["registerMemoryRuntime"] = () => {};
const noopRegisterMemoryEmbeddingProvider: SkillSetPluginApi["registerMemoryEmbeddingProvider"] =
  () => {};
const noopOn: SkillSetPluginApi["on"] = () => {};

export function buildPluginApi(params: BuildPluginApiParams): SkillSetPluginApi {
  const handlers = params.handlers ?? {};
  return {
    id: params.id,
    name: params.name,
    version: params.version,
    description: params.description,
    source: params.source,
    rootDir: params.rootDir,
    registrationMode: params.registrationMode,
    config: params.config,
    pluginConfig: params.pluginConfig,
    runtime: params.runtime,
    logger: params.logger,
    registerTool: handlers.registerTool ?? noopRegisterTool,
    registerHook: handlers.registerHook ?? noopRegisterHook,
    registerHttpRoute: handlers.registerHttpRoute ?? noopRegisterHttpRoute,
    registerChannel: handlers.registerChannel ?? noopRegisterChannel,
    registerGatewayMethod: handlers.registerGatewayMethod ?? noopRegisterGatewayMethod,
    registerCli: handlers.registerCli ?? noopRegisterCli,
    registerReload: handlers.registerReload ?? noopRegisterReload,
    registerNodeHostCommand: handlers.registerNodeHostCommand ?? noopRegisterNodeHostCommand,
    registerSecurityAuditCollector:
      handlers.registerSecurityAuditCollector ?? noopRegisterSecurityAuditCollector,
    registerService: handlers.registerService ?? noopRegisterService,
    registerCliBackend: handlers.registerCliBackend ?? noopRegisterCliBackend,
    registerTextTransforms: handlers.registerTextTransforms ?? noopRegisterTextTransforms,
    registerConfigMigration: handlers.registerConfigMigration ?? noopRegisterConfigMigration,
    registerAutoEnableProbe: handlers.registerAutoEnableProbe ?? noopRegisterAutoEnableProbe,
    registerProvider: handlers.registerProvider ?? noopRegisterProvider,
    registerSpeechProvider: handlers.registerSpeechProvider ?? noopRegisterSpeechProvider,
    registerRealtimeTranscriptionProvider:
      handlers.registerRealtimeTranscriptionProvider ?? noopRegisterRealtimeTranscriptionProvider,
    registerRealtimeVoiceProvider:
      handlers.registerRealtimeVoiceProvider ?? noopRegisterRealtimeVoiceProvider,
    registerMediaUnderstandingProvider:
      handlers.registerMediaUnderstandingProvider ?? noopRegisterMediaUnderstandingProvider,
    registerImageGenerationProvider:
      handlers.registerImageGenerationProvider ?? noopRegisterImageGenerationProvider,
    registerVideoGenerationProvider:
      handlers.registerVideoGenerationProvider ?? noopRegisterVideoGenerationProvider,
    registerMusicGenerationProvider:
      handlers.registerMusicGenerationProvider ?? noopRegisterMusicGenerationProvider,
    registerWebFetchProvider: handlers.registerWebFetchProvider ?? noopRegisterWebFetchProvider,
    registerWebSearchProvider: handlers.registerWebSearchProvider ?? noopRegisterWebSearchProvider,
    registerInteractiveHandler:
      handlers.registerInteractiveHandler ?? noopRegisterInteractiveHandler,
    onConversationBindingResolved:
      handlers.onConversationBindingResolved ?? noopOnConversationBindingResolved,
    registerCommand: handlers.registerCommand ?? noopRegisterCommand,
    registerContextEngine: handlers.registerContextEngine ?? noopRegisterContextEngine,
    registerCompactionProvider:
      handlers.registerCompactionProvider ?? noopRegisterCompactionProvider,
    registerAgentHarness: handlers.registerAgentHarness ?? noopRegisterAgentHarness,
    registerEmbeddedExtensionFactory:
      handlers.registerEmbeddedExtensionFactory ?? noopRegisterEmbeddedExtensionFactory,
    registerCodexAppServerExtensionFactory:
      handlers.registerCodexAppServerExtensionFactory ?? noopRegisterCodexAppServerExtensionFactory,
    registerDetachedTaskRuntime:
      handlers.registerDetachedTaskRuntime ?? noopRegisterDetachedTaskRuntime,
    registerMemoryCapability: handlers.registerMemoryCapability ?? noopRegisterMemoryCapability,
    registerMemoryPromptSection:
      handlers.registerMemoryPromptSection ?? noopRegisterMemoryPromptSection,
    registerMemoryPromptSupplement:
      handlers.registerMemoryPromptSupplement ?? noopRegisterMemoryPromptSupplement,
    registerMemoryCorpusSupplement:
      handlers.registerMemoryCorpusSupplement ?? noopRegisterMemoryCorpusSupplement,
    registerMemoryFlushPlan: handlers.registerMemoryFlushPlan ?? noopRegisterMemoryFlushPlan,
    registerMemoryRuntime: handlers.registerMemoryRuntime ?? noopRegisterMemoryRuntime,
    registerMemoryEmbeddingProvider:
      handlers.registerMemoryEmbeddingProvider ?? noopRegisterMemoryEmbeddingProvider,
    resolvePath: params.resolvePath,
    on: handlers.on ?? noopOn,
  };
}

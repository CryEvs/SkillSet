package ai.skillset.app.node

import ai.skillset.app.protocol.SkillSetCalendarCommand
import ai.skillset.app.protocol.SkillSetCanvasA2UICommand
import ai.skillset.app.protocol.SkillSetCanvasCommand
import ai.skillset.app.protocol.SkillSetCameraCommand
import ai.skillset.app.protocol.SkillSetCapability
import ai.skillset.app.protocol.SkillSetCallLogCommand
import ai.skillset.app.protocol.SkillSetContactsCommand
import ai.skillset.app.protocol.SkillSetDeviceCommand
import ai.skillset.app.protocol.SkillSetLocationCommand
import ai.skillset.app.protocol.SkillSetMotionCommand
import ai.skillset.app.protocol.SkillSetNotificationsCommand
import ai.skillset.app.protocol.SkillSetPhotosCommand
import ai.skillset.app.protocol.SkillSetSmsCommand
import ai.skillset.app.protocol.SkillSetSystemCommand

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val sendSmsAvailable: Boolean,
  val readSmsAvailable: Boolean,
  val smsSearchPossible: Boolean,
  val callLogAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SendSmsAvailable,
  ReadSmsAvailable,
  RequestableSmsSearchAvailable,
  CallLogAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  CallLogAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = SkillSetCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = SkillSetCapability.Device.rawValue),
      NodeCapabilitySpec(name = SkillSetCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = SkillSetCapability.System.rawValue),
      NodeCapabilitySpec(
        name = SkillSetCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = SkillSetCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = SkillSetCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = SkillSetCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = SkillSetCapability.Photos.rawValue),
      NodeCapabilitySpec(name = SkillSetCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = SkillSetCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = SkillSetCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
      NodeCapabilitySpec(
        name = SkillSetCapability.CallLog.rawValue,
        availability = NodeCapabilityAvailability.CallLogAvailable,
      ),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = SkillSetCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = SkillSetSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = SkillSetCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = SkillSetCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = SkillSetLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = SkillSetDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = SkillSetMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = SkillSetMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = SkillSetSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SendSmsAvailable,
      ),
      InvokeCommandSpec(
        name = SkillSetSmsCommand.Search.rawValue,
        availability = InvokeCommandAvailability.RequestableSmsSearchAvailable,
      ),
      InvokeCommandSpec(
        name = SkillSetCallLogCommand.Search.rawValue,
        availability = InvokeCommandAvailability.CallLogAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.sendSmsAvailable || flags.readSmsAvailable
          NodeCapabilityAvailability.CallLogAvailable -> flags.callLogAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SendSmsAvailable -> flags.sendSmsAvailable
          InvokeCommandAvailability.ReadSmsAvailable -> flags.readSmsAvailable
          InvokeCommandAvailability.RequestableSmsSearchAvailable -> flags.smsSearchPossible
          InvokeCommandAvailability.CallLogAvailable -> flags.callLogAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}

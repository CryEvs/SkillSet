package ai.skillset.app.node

import ai.skillset.app.protocol.SkillSetCalendarCommand
import ai.skillset.app.protocol.SkillSetCameraCommand
import ai.skillset.app.protocol.SkillSetCallLogCommand
import ai.skillset.app.protocol.SkillSetCapability
import ai.skillset.app.protocol.SkillSetContactsCommand
import ai.skillset.app.protocol.SkillSetDeviceCommand
import ai.skillset.app.protocol.SkillSetLocationCommand
import ai.skillset.app.protocol.SkillSetMotionCommand
import ai.skillset.app.protocol.SkillSetNotificationsCommand
import ai.skillset.app.protocol.SkillSetPhotosCommand
import ai.skillset.app.protocol.SkillSetSmsCommand
import ai.skillset.app.protocol.SkillSetSystemCommand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      SkillSetCapability.Canvas.rawValue,
      SkillSetCapability.Device.rawValue,
      SkillSetCapability.Notifications.rawValue,
      SkillSetCapability.System.rawValue,
      SkillSetCapability.Photos.rawValue,
      SkillSetCapability.Contacts.rawValue,
      SkillSetCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      SkillSetCapability.Camera.rawValue,
      SkillSetCapability.Location.rawValue,
      SkillSetCapability.Sms.rawValue,
      SkillSetCapability.CallLog.rawValue,
      SkillSetCapability.VoiceWake.rawValue,
      SkillSetCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      SkillSetDeviceCommand.Status.rawValue,
      SkillSetDeviceCommand.Info.rawValue,
      SkillSetDeviceCommand.Permissions.rawValue,
      SkillSetDeviceCommand.Health.rawValue,
      SkillSetNotificationsCommand.List.rawValue,
      SkillSetNotificationsCommand.Actions.rawValue,
      SkillSetSystemCommand.Notify.rawValue,
      SkillSetPhotosCommand.Latest.rawValue,
      SkillSetContactsCommand.Search.rawValue,
      SkillSetContactsCommand.Add.rawValue,
      SkillSetCalendarCommand.Events.rawValue,
      SkillSetCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      SkillSetCameraCommand.Snap.rawValue,
      SkillSetCameraCommand.Clip.rawValue,
      SkillSetCameraCommand.List.rawValue,
      SkillSetLocationCommand.Get.rawValue,
      SkillSetMotionCommand.Activity.rawValue,
      SkillSetMotionCommand.Pedometer.rawValue,
      SkillSetSmsCommand.Send.rawValue,
      SkillSetSmsCommand.Search.rawValue,
      SkillSetCallLogCommand.Search.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          sendSmsAvailable = false,
          readSmsAvailable = false,
          smsSearchPossible = false,
          callLogAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(SkillSetMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(SkillSetMotionCommand.Pedometer.rawValue))
  }

  @Test
  fun advertisedCommands_splitsSmsSendAndSearchAvailability() {
    val readOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(readSmsAvailable = true, smsSearchPossible = true),
      )
    val sendOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCommands.contains(SkillSetSmsCommand.Search.rawValue))
    assertFalse(readOnlyCommands.contains(SkillSetSmsCommand.Send.rawValue))
    assertTrue(sendOnlyCommands.contains(SkillSetSmsCommand.Send.rawValue))
    assertFalse(sendOnlyCommands.contains(SkillSetSmsCommand.Search.rawValue))
    assertTrue(requestableSearchCommands.contains(SkillSetSmsCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_includeSmsWhenEitherSmsPathIsAvailable() {
    val readOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(readSmsAvailable = true),
      )
    val sendOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCapabilities.contains(SkillSetCapability.Sms.rawValue))
    assertTrue(sendOnlyCapabilities.contains(SkillSetCapability.Sms.rawValue))
    assertFalse(requestableSearchCapabilities.contains(SkillSetCapability.Sms.rawValue))
  }

  @Test
  fun advertisedCommands_excludesCallLogWhenUnavailable() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(callLogAvailable = false))

    assertFalse(commands.contains(SkillSetCallLogCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_excludesCallLogWhenUnavailable() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(callLogAvailable = false))

    assertFalse(capabilities.contains(SkillSetCapability.CallLog.rawValue))
  }

  @Test
  fun advertisedCapabilities_includesVoiceWakeWithoutAdvertisingCommands() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(voiceWakeEnabled = true))
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(voiceWakeEnabled = true))

    assertTrue(capabilities.contains(SkillSetCapability.VoiceWake.rawValue))
    assertFalse(commands.any { it.contains("voice", ignoreCase = true) })
  }

  @Test
  fun find_returnsForegroundMetadataForCameraCommands() {
    val list = InvokeCommandRegistry.find(SkillSetCameraCommand.List.rawValue)
    val location = InvokeCommandRegistry.find(SkillSetLocationCommand.Get.rawValue)

    assertNotNull(list)
    assertEquals(true, list?.requiresForeground)
    assertNotNull(location)
    assertEquals(false, location?.requiresForeground)
  }

  @Test
  fun find_returnsNullForUnknownCommand() {
    assertNull(InvokeCommandRegistry.find("not.real"))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    sendSmsAvailable: Boolean = false,
    readSmsAvailable: Boolean = false,
    smsSearchPossible: Boolean = false,
    callLogAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      sendSmsAvailable = sendSmsAvailable,
      readSmsAvailable = readSmsAvailable,
      smsSearchPossible = smsSearchPossible,
      callLogAvailable = callLogAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}

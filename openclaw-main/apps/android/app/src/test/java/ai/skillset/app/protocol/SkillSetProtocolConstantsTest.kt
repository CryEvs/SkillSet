package ai.skillset.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class SkillSetProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", SkillSetCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", SkillSetCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", SkillSetCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", SkillSetCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", SkillSetCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", SkillSetCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", SkillSetCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", SkillSetCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", SkillSetCapability.Canvas.rawValue)
    assertEquals("camera", SkillSetCapability.Camera.rawValue)
    assertEquals("voiceWake", SkillSetCapability.VoiceWake.rawValue)
    assertEquals("location", SkillSetCapability.Location.rawValue)
    assertEquals("sms", SkillSetCapability.Sms.rawValue)
    assertEquals("device", SkillSetCapability.Device.rawValue)
    assertEquals("notifications", SkillSetCapability.Notifications.rawValue)
    assertEquals("system", SkillSetCapability.System.rawValue)
    assertEquals("photos", SkillSetCapability.Photos.rawValue)
    assertEquals("contacts", SkillSetCapability.Contacts.rawValue)
    assertEquals("calendar", SkillSetCapability.Calendar.rawValue)
    assertEquals("motion", SkillSetCapability.Motion.rawValue)
    assertEquals("callLog", SkillSetCapability.CallLog.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", SkillSetCameraCommand.List.rawValue)
    assertEquals("camera.snap", SkillSetCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", SkillSetCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", SkillSetNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", SkillSetNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", SkillSetDeviceCommand.Status.rawValue)
    assertEquals("device.info", SkillSetDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", SkillSetDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", SkillSetDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", SkillSetSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", SkillSetPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", SkillSetContactsCommand.Search.rawValue)
    assertEquals("contacts.add", SkillSetContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", SkillSetCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", SkillSetCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", SkillSetMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", SkillSetMotionCommand.Pedometer.rawValue)
  }

  @Test
  fun smsCommandsUseStableStrings() {
    assertEquals("sms.send", SkillSetSmsCommand.Send.rawValue)
    assertEquals("sms.search", SkillSetSmsCommand.Search.rawValue)
  }

  @Test
  fun callLogCommandsUseStableStrings() {
    assertEquals("callLog.search", SkillSetCallLogCommand.Search.rawValue)
  }

}

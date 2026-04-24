export type MatrixManagedDeviceInfo = {
  deviceId: string;
  displayName: string | null;
  current: boolean;
};

export type MatrixDeviceHealthSummary = {
  currentDeviceId: string | null;
  staleSkillSetDevices: MatrixManagedDeviceInfo[];
  currentSkillSetDevices: MatrixManagedDeviceInfo[];
};

const SKILLSET_DEVICE_NAME_PREFIX = "SkillSet ";

export function isSkillSetManagedMatrixDevice(displayName: string | null | undefined): boolean {
  return displayName?.startsWith(SKILLSET_DEVICE_NAME_PREFIX) === true;
}

export function summarizeMatrixDeviceHealth(
  devices: MatrixManagedDeviceInfo[],
): MatrixDeviceHealthSummary {
  const currentDeviceId = devices.find((device) => device.current)?.deviceId ?? null;
  const openClawDevices = devices.filter((device) =>
    isSkillSetManagedMatrixDevice(device.displayName),
  );
  return {
    currentDeviceId,
    staleSkillSetDevices: openClawDevices.filter((device) => !device.current),
    currentSkillSetDevices: openClawDevices.filter((device) => device.current),
  };
}

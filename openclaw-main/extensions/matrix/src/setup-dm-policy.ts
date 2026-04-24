import type { DmPolicy } from "skillset/plugin-sdk/config-runtime";
import { addWildcardAllowFrom, normalizeAllowFromEntries } from "skillset/plugin-sdk/setup";
import type { MatrixConfig } from "./types.js";

type MatrixDmAllowFrom = NonNullable<MatrixConfig["dm"]>["allowFrom"];

export function resolveMatrixSetupDmAllowFrom(
  policy: DmPolicy,
  allowFrom: MatrixDmAllowFrom,
): string[] {
  if (policy === "open") {
    return addWildcardAllowFrom(allowFrom);
  }
  return normalizeAllowFromEntries(allowFrom ?? []).filter((entry) => entry !== "*");
}

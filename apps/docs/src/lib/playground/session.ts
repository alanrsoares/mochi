/**
 * Playground session state — localStorage persistence and `?code=` share
 * payloads. Persisting the source is an explicit call here, never a side
 * effect of URL encoding: an oversized share payload must not lose the
 * user's local draft.
 */

import {
  decodeSharedCode,
  encodeSharedCode,
  isSharedCodeWithinLimits,
  MAX_ENCODED_CODE_LENGTH,
} from "../shared-code";
import { DEFAULT_PRESET_CODE } from "./presets";

const STORAGE_KEY = "mochi_playground_code_v2";
const AUTORUN_KEY = "mochi_playground_autorun";

export const readAutorun = (): boolean => {
  const v = localStorage.getItem(AUTORUN_KEY);
  return v === null ? true : v === "1";
};

export const persistAutorun = (on: boolean): void => {
  localStorage.setItem(AUTORUN_KEY, on ? "1" : "0");
};

export const readInitialCode = (): string =>
  localStorage.getItem(STORAGE_KEY) || DEFAULT_PRESET_CODE;

export const persistSource = (source: string): void => {
  localStorage.setItem(STORAGE_KEY, source);
};

/** Decode a `?code=` payload from a search string; null when absent/invalid/oversized. */
export const loadSharedCode = async (search: string): Promise<string | null> => {
  const paramCode = new URLSearchParams(search).get("code");
  if (!paramCode || paramCode.length > MAX_ENCODED_CODE_LENGTH) return null;
  const decoded = await decodeSharedCode(paramCode)();
  if (decoded._tag !== "Ok" || !decoded.value) return null;
  if (!isSharedCodeWithinLimits(paramCode, decoded.value)) return null;
  return decoded.value;
};

/** Encode source for the share URL; null when encoding fails or exceeds limits. */
export const encodeShareParam = async (source: string): Promise<string | null> => {
  const encoded = await encodeSharedCode(source)();
  if (encoded._tag !== "Ok") return null;
  if (!isSharedCodeWithinLimits(encoded.value, source)) return null;
  return encoded.value;
};

import { isAxiosError } from "axios";

export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function isPermissionError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 401 || status === 403;
}

export function appendIfDefined(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined,
): void {
  if (value != null && value !== "") {
    params.append(key, String(value));
  }
}

export function appendArray(
  params: URLSearchParams,
  key: string,
  values: string[] | undefined,
): void {
  (values ?? []).forEach((value) => {
    if (value) params.append(key, value);
  });
}

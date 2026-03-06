export function setAuthCookie(token: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax${secure}`;
}

export function clearAuthCookie() {
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
}

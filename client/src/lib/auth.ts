export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeAuthToken(): void {
  localStorage.removeItem("token");
}

export function logout(): void {
  removeAuthToken();
  window.location.href = "/login";
}

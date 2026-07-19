import { AuthPort } from '@application/ports';

/**
 * Store en memoria para el token OAuth de Google Drive.
 * No persiste en localStorage: los access tokens expiran en ~1 hora y
 * @react-oauth/google los renueva silenciosamente. Solo el email se guarda
 * en sessionStorage para mostrarlo en la UI entre recargas dentro de la misma sesión.
 */
export class GoogleAuthStore implements AuthPort {
  private token: string | null = null;
  private email: string | null = null;

  constructor() {
    // Restaurar email de sesión (cosmético, el token siempre se reobtiene via OAuth)
    this.email = sessionStorage.getItem('capmark_google_email');
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string, userEmail?: string): void {
    this.token = token;
    if (userEmail) {
      this.email = userEmail;
      sessionStorage.setItem('capmark_google_email', userEmail);
    }
  }

  getUserEmail(): string | null {
    return this.email;
  }

  logout(): void {
    this.token = null;
    this.email = null;
    sessionStorage.removeItem('capmark_google_email');
  }
}

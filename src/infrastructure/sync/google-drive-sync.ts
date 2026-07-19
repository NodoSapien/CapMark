import { BackupService } from '@application/backup-service';
import { AuthPort, SyncPort } from '@application/ports';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FILE_NAME = 'capmark-db.json';

/**
 * Adaptador de sincronización BYOS sobre la appDataFolder de Google Drive del usuario.
 *
 * Estrategia: el backup completo se serializa como un único JSON (`capmark-db.json`)
 * guardado en la carpeta oculta `appDataFolder` (invisible para el usuario en Drive UI,
 * aislada por el Client ID de la app). Conflictos: última escritura gana por `exportadoEn`.
 *
 * Ciclo de sync:
 *   push() → exportar() localmente → subir a Drive (PUT si existe, POST si no).
 *   pull() → descargar de Drive → importar() con merge LWW.
 *
 * La app es local-first: sin token OAuth, `disponible()` es false y todo sigue en local.
 * Implementa SyncPort (RNF-009); el dominio y la UI no conocen esta clase.
 */
export class GoogleDriveSync implements SyncPort {
  constructor(
    private auth: AuthPort,
    private backup: BackupService,
  ) {}

  disponible(): boolean {
    return this.auth.getToken() !== null;
  }

  async probarConexion(): Promise<boolean> {
    if (!this.disponible()) return false;
    try {
      const res = await fetch(`${DRIVE_API}/about?fields=user`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Exporta el catálogo completo y lo sube a appDataFolder/capmark-db.json.
   * Si el archivo ya existe en Drive, lo sobreescribe (PUT multipart).
   * Si no existe, lo crea (POST multipart).
   */
  async push(): Promise<void> {
    if (!this.disponible()) return;
    const data = await this.backup.exportar();
    const body = JSON.stringify(data);
    const existingId = await this.findFileId();

    if (existingId) {
      await this.updateFile(existingId, body);
    } else {
      await this.createFile(body);
    }
  }

  /**
   * Descarga capmark-db.json de appDataFolder y lo fusiona con el estado local.
   * Estrategia LWW: si `exportadoEn` remoto > local, se importa; si no, se ignora.
   */
  async pull(): Promise<void> {
    if (!this.disponible()) return;
    const fileId = await this.findFileId();
    if (!fileId) return; // primera vez: Drive está vacío, no hay nada que bajar

    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: this.headers(),
    });
    if (!res.ok) return;

    const remote = await res.json();

    // LWW: solo importamos si el remoto es más reciente que nuestro último export
    const localBackup = await this.backup.exportar();
    const remoteTs = new Date(remote.exportadoEn ?? 0).getTime();
    const localTs = new Date(localBackup.exportadoEn ?? 0).getTime();
    if (remoteTs > localTs) {
      await this.backup.importar(remote, /* reemplazar= */ true);
    }
  }

  // ── helpers privados ────────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.auth.getToken()}` };
  }

  /** Busca el archivo por nombre en appDataFolder. Devuelve su id o null. */
  private async findFileId(): Promise<string | null> {
    const q = encodeURIComponent(
      `name='${FILE_NAME}' and 'appDataFolder' in parents and trashed=false`,
    );
    const res = await fetch(`${DRIVE_API}/files?spaces=appDataFolder&q=${q}&fields=files(id)`, {
      headers: this.headers(),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { files: { id: string }[] };
    return data.files[0]?.id ?? null;
  }

  /** Crea el archivo en appDataFolder (primera vez). */
  private async createFile(body: string): Promise<void> {
    const metadata = { name: FILE_NAME, parents: ['appDataFolder'] };
    const form = this.buildMultipart(metadata, body);
    await fetch(`${DRIVE_UPLOAD}/files?uploadType=multipart`, {
      method: 'POST',
      headers: { ...this.headers(), 'Content-Type': form.contentType },
      body: form.body,
    });
  }

  /** Sobreescribe el archivo existente (actualizaciones sucesivas). */
  private async updateFile(fileId: string, body: string): Promise<void> {
    const form = this.buildMultipart({}, body);
    await fetch(`${DRIVE_UPLOAD}/files/${fileId}?uploadType=multipart`, {
      method: 'PATCH',
      headers: { ...this.headers(), 'Content-Type': form.contentType },
      body: form.body,
    });
  }

  /**
   * Construye un cuerpo multipart/related para la Drive API.
   * Parte 1: metadatos JSON. Parte 2: contenido JSON de la base de datos.
   */
  private buildMultipart(
    metadata: object,
    content: string,
  ): { contentType: string; body: string } {
    const boundary = 'capmark_boundary';
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');
    return { contentType: `multipart/related; boundary=${boundary}`, body };
  }
}

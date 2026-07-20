import { useState, useCallback } from 'react';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon,
  IonItem, IonLabel, IonModal, IonNote, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/react';
import {
  logoGoogle, cloudDoneOutline, cloudOfflineOutline,
  syncOutline, logOutOutline, cloudUploadOutline, cloudDownloadOutline,
} from 'ionicons/icons';
import { useGoogleLogin } from '@react-oauth/google';
import { container } from '@infrastructure/container';

type EstadoSync = 'desconectado' | 'conectando' | 'conectado' | 'sincronizando' | 'error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleto?: () => void; // para que CatalogoPage recargue tras un pull
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/**
 * Panel de sincronización con Google Drive (BYOS).
 * Maneja el ciclo completo: OAuth login → push/pull → logout.
 * La app sigue funcionando si el usuario no conecta: local-first (RNF-004).
 */
export default function SyncPanel(props: Props) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <IonModal isOpen={props.isOpen} onDidDismiss={props.onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Google Drive Sync</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={props.onClose}>Cerrar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem lines="none" style={{ marginBottom: 8 }}>
            <IonIcon icon={cloudOfflineOutline} color="medium" slot="start" />
            <IonLabel><h2>No configurado</h2></IonLabel>
          </IonItem>
          <IonNote color="warning" style={{ display: 'block', padding: '16px', fontSize: 13 }}>
            La sincronización en la nube no está habilitada. Falta configurar <strong>VITE_GOOGLE_CLIENT_ID</strong> en tu archivo <code>.env</code>.
          </IonNote>
        </IonContent>
      </IonModal>
    );
  }
  return <SyncPanelInner {...props} />;
}

function SyncPanelInner({ isOpen, onClose, onSyncCompleto }: Props) {
  const [estado, setEstado] = useState<EstadoSync>(
    container.sync.disponible() ? 'conectado' : 'desconectado',
  );
  const [mensaje, setMensaje] = useState<string>('');
  const email = container.auth.getUserEmail();

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    onSuccess: (tokenResponse) => {
      container.auth.setToken(tokenResponse.access_token);
      setEstado('conectado');
      setMensaje('Conectado. Sincroniza para subir o bajar tus datos.');
    },
    onError: () => {
      setEstado('error');
      setMensaje('No se pudo conectar con Google. Inténtalo de nuevo.');
    },
  });

  const handleLogin = useCallback(() => {
    setEstado('conectando');
    setMensaje('');
    login();
  }, [login]);

  const sincronizar = useCallback(async () => {
    if (!container.sync.disponible()) return;
    setEstado('sincronizando');
    setMensaje('');
    try {
      await container.sync.pull();
      await container.sync.push();
      setEstado('conectado');
      setMensaje(`Sincronizado · ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`);
      onSyncCompleto?.();
    } catch (e) {
      setEstado('error');
      setMensaje(e instanceof Error ? e.message : 'Error al sincronizar.');
    }
  }, [onSyncCompleto]);

  const subir = useCallback(async () => {
    if (!container.sync.disponible()) return;
    setEstado('sincronizando');
    setMensaje('');
    try {
      await container.sync.push();
      setEstado('conectado');
      setMensaje(`Datos subidos a Drive · ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (e) {
      setEstado('error');
      setMensaje(e instanceof Error ? e.message : 'Error al subir.');
    }
  }, []);

  const bajar = useCallback(async () => {
    if (!container.sync.disponible()) return;
    setEstado('sincronizando');
    setMensaje('');
    try {
      await container.sync.pull();
      setEstado('conectado');
      setMensaje(`Datos bajados de Drive · ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`);
      onSyncCompleto?.();
    } catch (e) {
      setEstado('error');
      setMensaje(e instanceof Error ? e.message : 'Error al bajar.');
    }
  }, [onSyncCompleto]);

  const logout = useCallback(() => {
    container.auth.logout();
    setEstado('desconectado');
    setMensaje('');
  }, []);

  const cargando = estado === 'conectando' || estado === 'sincronizando';

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Google Drive Sync</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Cerrar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        {/* ── Estado de conexión ── */}
        <IonItem lines="none" style={{ marginBottom: 8 }}>
          <IonIcon
            icon={estado === 'conectado' || estado === 'sincronizando' ? cloudDoneOutline : cloudOfflineOutline}
            color={estado === 'error' ? 'danger' : estado === 'conectado' || estado === 'sincronizando' ? 'success' : 'medium'}
            slot="start"
          />
          <IonLabel>
            <h2>
              {{
                desconectado: 'Sin conectar',
                conectando: 'Conectando…',
                conectado: email ? `Conectado como ${email}` : 'Conectado',
                sincronizando: 'Sincronizando…',
                error: 'Error',
              }[estado]}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
              Tus datos se guardan en tu propio Google Drive, de forma privada y cifrada por Google.
            </p>
          </IonLabel>
          {cargando && <IonSpinner slot="end" name="crescent" />}
        </IonItem>

        {/* ── Mensaje de estado ── */}
        {mensaje && (
          <IonNote
            color={estado === 'error' ? 'danger' : 'success'}
            style={{ display: 'block', padding: '4px 16px 12px', fontSize: 13 }}
          >
            {mensaje}
          </IonNote>
        )}

        {/* ── Panel desconectado ── */}
        {estado === 'desconectado' && (
          <div style={{ padding: '16px 0' }}>
            <IonButton expand="block" onClick={handleLogin}>
              <IonIcon slot="start" icon={logoGoogle} />
              Conectar con Google Drive
            </IonButton>
            <IonNote style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
              Solo se solicita acceso a la carpeta privada de CapMark.
              Ninguna otra app podrá leer tus datos.
            </IonNote>
          </div>
        )}

        {/* ── Panel conectado ── */}
        {(estado === 'conectado' || estado === 'sincronizando' || estado === 'error') && container.sync.disponible() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0' }}>
            <IonButton expand="block" onClick={() => void sincronizar()} disabled={cargando}>
              <IonIcon slot="start" icon={syncOutline} />
              Sincronizar (subir y bajar)
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={() => void subir()} disabled={cargando}>
              <IonIcon slot="start" icon={cloudUploadOutline} />
              Solo subir
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={() => void bajar()} disabled={cargando}>
              <IonIcon slot="start" icon={cloudDownloadOutline} />
              Solo bajar
            </IonButton>
            <IonButton expand="block" fill="clear" color="medium" onClick={logout} disabled={cargando}>
              <IonIcon slot="start" icon={logOutOutline} />
              Desconectar cuenta
            </IonButton>
          </div>
        )}

        {/* ── Nota informativa ── */}
        <IonNote style={{ display: 'block', marginTop: 24, fontSize: 12, lineHeight: 1.5 }}>
          Los datos se guardan en una carpeta oculta de tu Drive, invisible en la interfaz normal
          de Google Drive. Solo CapMark puede leerla. Puedes seguir usando la app sin conexión:
          los cambios se sincronizarán la próxima vez que pulses "Sincronizar".
        </IonNote>

      </IonContent>
    </IonModal>
  );
}

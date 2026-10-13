import { useCallback, useRef, useState } from 'react';
import {
  IonBadge, IonButton, IonButtons, IonChip, IonContent, IonFab, IonFabButton, IonHeader,
  IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonLabel, IonList,
  IonNote, IonPage, IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { add, cloudOfflineOutline, cloudDoneOutline, downloadOutline, folderOpenOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Filtro, ItemCatalogo } from '@application/catalogo-service';
import { NuevaObra } from '@application/ports';
import { ESTADOS_OBRA, PRIORIDADES } from '@domain/types';
import { container } from '@infrastructure/container';
import ObraFormModal from '@ui/components/ObraFormModal';
import { capFmt, colorEstado, colorPrioridad, fechaCorta } from '@ui/format';
import { sembrarDemo } from '@ui/seed';

const LIMITE_PAGINA = 20;

// Estado de sincronización de cara al usuario. La app siempre funciona en local (RNF-004);
// esto solo informa si además hay un backend y si responde.
type EstadoSync = 'local' | 'comprobando' | 'conectado' | 'sin-conexion';

export default function CatalogoPage() {
  const history = useHistory();
  const [filtro, setFiltro] = useState<Filtro>({});
  const [filas, setFilas] = useState<ItemCatalogo[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modal, setModal] = useState(false);
  const [sync, setSync] = useState<EstadoSync>(
    container.sync.disponible() ? 'comprobando' : 'local',
  );

  // Comprueba si el backend responde ahora mismo. Sin backend configurado ⇒ 'local'.
  const comprobarSync = useCallback(async () => {
    if (!container.sync.disponible()) { setSync('local'); return; }
    setSync('comprobando');
    setSync((await container.sync.probarConexion()) ? 'conectado' : 'sin-conexion');
  }, []);

  const cargarTags = useCallback(async () => {
    const lista = await container.catalogo.listarTags();
    setTags(lista);
  }, []);

  const recargar = useCallback(async (f: Filtro) => {
    const res = await container.catalogo.listarPagina(f, { pagina: 1, limite: LIMITE_PAGINA });
    setFilas(res.items);
    setTotal(res.total);
    setPagina(1);
    setTotalPaginas(res.totalPaginas);
  }, []);

  const cargarMas = async (ev: CustomEvent<void>) => {
    const target = ev.target as HTMLIonInfiniteScrollElement;
    if (pagina >= totalPaginas) {
      await target.complete();
      return;
    }
    const siguiente = pagina + 1;
    const res = await container.catalogo.listarPagina(filtro, { pagina: siguiente, limite: LIMITE_PAGINA });
    setFilas((prev) => [...prev, ...res.items]);
    setPagina(siguiente);
    setTotalPaginas(res.totalPaginas);
    await target.complete();
  };

  useIonViewWillEnter(() => {
    void cargarTags();
    void recargar(filtro);
    void comprobarSync();
  });

  const aplicar = (patch: Partial<Filtro>) => {
    const f = { ...filtro, ...patch };
    setFiltro(f);
    void recargar(f);
  };

  const crear = async (input: NuevaObra) => {
    await container.catalogo.crear(input);
    await cargarTags();
    await recargar(filtro);
  };

  const fileRef = useRef<HTMLInputElement>(null);

  // Modo absolutamente local: exporta todo a un archivo JSON (sin nube).
  const exportar = async () => {
    const backup = await container.backup.exportar();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capmark-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importar = async (file: File) => {
    try {
      const backup = JSON.parse(await file.text());
      await container.backup.importar(backup);
      await cargarTags();
      await recargar(filtro);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo importar el archivo.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Catálogo</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={exportar} title="Exportar backup (local)">
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
            <IonButton onClick={() => fileRef.current?.click()} title="Importar backup">
              <IonIcon slot="icon-only" icon={folderOpenOutline} />
            </IonButton>
            <IonIcon
              icon={sync === 'conectado' ? cloudDoneOutline : cloudOfflineOutline}
              color={sync === 'sin-conexion' ? 'warning' : undefined}
              title={{
                local: 'Modo local (sin backend)',
                comprobando: 'Comprobando conexión…',
                conectado: 'Sincronización disponible',
                'sin-conexion': 'No se puede sincronizar',
              }[sync]}
              onClick={() => void comprobarSync()}
              style={{ marginRight: 12, marginLeft: 4, cursor: 'pointer' }}
            />
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Buscar por título o alias"
            debounce={200}
            onIonInput={(e) => aplicar({ termino: e.detail.value ?? '' })}
          />
        </IonToolbar>
        <IonToolbar>
          <IonItem lines="none">
            <IonSelect placeholder="Estado" value={filtro.estado} onIonChange={(e) => aplicar({ estado: e.detail.value || undefined })}>
              <IonSelectOption value="">Todos</IonSelectOption>
              {ESTADOS_OBRA.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
            </IonSelect>
            <IonSelect placeholder="Prioridad" value={filtro.prioridad} onIonChange={(e) => aplicar({ prioridad: e.detail.value || undefined })}>
              <IonSelectOption value="">Todas</IonSelectOption>
              {PRIORIDADES.map((p) => <IonSelectOption key={p} value={p}>{p}</IonSelectOption>)}
            </IonSelect>
            <IonSelect placeholder="Tag" value={filtro.tag} onIonChange={(e) => aplicar({ tag: e.detail.value || undefined })}>
              <IonSelectOption value="">Todos</IonSelectOption>
              {tags.map((t) => <IonSelectOption key={t} value={t}>{t}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {sync === 'sin-conexion' && (
          <IonNote color="warning" style={{ display: 'block', padding: 8 }}>
            No se puede sincronizar. Trabajando en modo local.
          </IonNote>
        )}
        <IonNote className="ion-padding-start" style={{ display: 'block', padding: 8 }}>
          {total} obra{total === 1 ? '' : 's'} {/* RF-014: contador real de coincidencias */}
        </IonNote>

        {filas.length === 0 ? (
          <div className="ion-padding ion-text-center">
            {total === 0 ? (
              <>
                <p className="muted">Tu catálogo está vacío.</p>
                <IonButton fill="outline" onClick={async () => { await sembrarDemo(); await cargarTags(); await recargar(filtro); }}>
                  Cargar datos de ejemplo
                </IonButton>
              </>
            ) : (
              <p className="muted">Ninguna obra coincide con los filtros.</p>
            )}
          </div>
        ) : (
          <>
            <IonList>
              {filas.map(({ obra, capitulo, ultima }) => (
                <IonItem key={obra.id} button detail onClick={() => history.push(`/obra/${obra.id}`)}>
                  <IonLabel>
                    <h2>{obra.titulo}</h2>
                    <p className="muted">
                      {obra.tipo} · Cap. <span className="cap-actual">{capFmt(capitulo)}</span> · Última: {fechaCorta(ultima)}
                    </p>
                    <div>
                      {obra.tags.slice(0, 3).map((t) => <IonChip key={t} outline>{t}</IonChip>)}
                    </div>
                  </IonLabel>
                  <IonBadge slot="end" color={colorPrioridad[obra.prioridad]}>{obra.prioridad}</IonBadge>
                  <IonBadge slot="end" className="estado-badge" color={colorEstado[obra.estado]}>{obra.estado}</IonBadge>
                </IonItem>
              ))}
            </IonList>

            <IonInfiniteScroll
              disabled={pagina >= totalPaginas}
              onIonInfinite={cargarMas}
            >
              <IonInfiniteScrollContent loadingText="Cargando más obras…" />
            </IonInfiniteScroll>
          </>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => setModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importar(f);
          e.target.value = '';
        }}
      />
      <ObraFormModal isOpen={modal} onClose={() => setModal(false)} onSave={crear} />
    </IonPage>
  );
}

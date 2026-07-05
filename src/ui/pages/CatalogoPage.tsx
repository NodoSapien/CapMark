import { useCallback, useState } from 'react';
import {
  IonBadge, IonButton, IonButtons, IonChip, IonContent, IonFab, IonFabButton, IonHeader,
  IonIcon, IonItem, IonLabel, IonList, IonNote, IonPage, IonSearchbar, IonSelect,
  IonSelectOption, IonTitle, IonToolbar, useIonViewWillEnter,
} from '@ionic/react';
import { add, cloudOfflineOutline, cloudDoneOutline, downloadOutline, folderOpenOutline } from 'ionicons/icons';
import { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Filtro } from '@application/catalogo-service';
import { NuevaObra } from '@application/ports';
import { Obra } from '@domain/obra';
import { ESTADOS_OBRA, PRIORIDADES } from '@domain/types';
import { container } from '@infrastructure/container';
import ObraFormModal from '@ui/components/ObraFormModal';
import { capFmt, colorEstado, colorPrioridad, fechaCorta } from '@ui/format';
import { sembrarDemo } from '@ui/seed';

interface Fila { obra: Obra; capitulo?: number; ultima?: string; }

export default function CatalogoPage() {
  const history = useHistory();
  const [filtro, setFiltro] = useState<Filtro>({});
  const [filas, setFilas] = useState<Fila[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(false);

  const recargar = useCallback(async (f: Filtro) => {
    // Universo de tags disponibles (a partir del catálogo completo) para el filtro RF-014.
    const todas = await container.catalogo.buscar({});
    setTotal(todas.length);
    setTags([...new Set(todas.flatMap((o) => o.tags))].sort((a, b) => a.localeCompare(b, 'es')));

    const obras = await container.catalogo.buscar(f);
    const filas = await Promise.all(
      obras.map(async (obra) => {
        const actual = await container.progreso.actual(obra.id);
        return { obra, capitulo: actual?.capitulo, ultima: actual?.registradoEn };
      }),
    );
    setFilas(filas);
  }, []);

  useIonViewWillEnter(() => { void recargar(filtro); });

  const aplicar = (patch: Partial<Filtro>) => {
    const f = { ...filtro, ...patch };
    setFiltro(f);
    void recargar(f);
  };

  const crear = async (input: NuevaObra) => {
    await container.catalogo.crear(input);
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
              icon={container.sync.disponible() ? cloudDoneOutline : cloudOfflineOutline}
              title={container.sync.disponible() ? 'Sync disponible' : 'Modo local (sin backend)'}
              style={{ marginRight: 12, marginLeft: 4 }}
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
        <IonNote className="ion-padding-start" style={{ display: 'block', padding: 8 }}>
          {filas.length} obra{filas.length === 1 ? '' : 's'} {/* RF-014: contador de coincidencias */}
        </IonNote>

        {filas.length === 0 ? (
          <div className="ion-padding ion-text-center">
            {total === 0 ? (
              <>
                <p className="muted">Tu catálogo está vacío.</p>
                <IonButton fill="outline" onClick={async () => { await sembrarDemo(); await recargar(filtro); }}>
                  Cargar datos de ejemplo
                </IonButton>
              </>
            ) : (
              <p className="muted">Ninguna obra coincide con los filtros.</p>
            )}
          </div>
        ) : (
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

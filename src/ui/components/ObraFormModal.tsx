import { useEffect, useState } from 'react';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar,
} from '@ionic/react';
import { codeSlash, createOutline } from 'ionicons/icons';
import { NuevaObra } from '@application/ports';
import { Obra } from '@domain/obra';
import { ESTADOS_OBRA, PRIORIDADES, TIPOS_OBRA, ESTADOS_PUBLICACION } from '@domain/types';
import { container } from '@infrastructure/container';

interface Props {
  isOpen: boolean;
  obra?: Obra; // si viene, es edición
  onClose: () => void;
  onSave: (input: NuevaObra) => Promise<void>;
}

const vacia: NuevaObra = { titulo: '', tipo: 'manga', estado: 'pendiente', prioridad: 'media' };

type Modo = 'form' | 'json';

export default function ObraFormModal({ isOpen, obra, onClose, onSave }: Props) {
  const [modo, setModo] = useState<Modo>('form');
  const [form, setForm] = useState<NuevaObra>(vacia);
  const [alias, setAlias] = useState('');
  const [tags, setTags] = useState('');
  const [url, setUrl] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [todasObras, setTodasObras] = useState<Obra[]>([]);

  useEffect(() => {
    if (isOpen) {
      container.catalogo.buscar({}).then(setTodasObras);
    }
  }, [isOpen]);

  useEffect(() => {
    if (obra) {
      const base: NuevaObra = {
        titulo: obra.titulo,
        tipo: obra.tipo,
        estado: obra.estado,
        prioridad: obra.prioridad,
        url: obra.url ?? '',
        notas: obra.notas,
        autor: obra.autor,
        artista: obra.artista,
        estadoPublicacion: obra.estadoPublicacion,
        calificacion: obra.calificacion,
        obrasRelacionadas: obra.obrasRelacionadas,
      };
      setForm(base);
      setAlias(obra.nombresAlternativos.join(', '));
      setTags(obra.tags.join(', '));
      setUrl(obra.url ?? '');
      setJsonText(JSON.stringify(
        { ...base, nombresAlternativos: obra.nombresAlternativos, tags: obra.tags, obrasRelacionadas: obra.obrasRelacionadas },
        null,
        2,
      ));
    } else {
      setForm(vacia);
      setAlias('');
      setTags('');
      setUrl('');
      setJsonText('');
    }
    setError(null);
    setJsonError(null);
    setModo('form');
  }, [obra, isOpen]);

  const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  /** Sync: cuando el usuario edita el form, actualiza el JSON en tiempo real */
  const sincronizarJson = (f: NuevaObra, a: string, t: string, u: string) => {
    const preview: NuevaObra = {
      ...f,
      nombresAlternativos: split(a),
      tags: split(t),
      url: u.trim() || undefined,
    };
    setJsonText(JSON.stringify(preview, null, 2));
  };

  const setField = (patch: Partial<NuevaObra>) => {
    const next = { ...form, ...patch };
    setForm(next);
    sincronizarJson(next, alias, tags, url);
  };

  const setAliasSync = (v: string) => {
    setAlias(v);
    sincronizarJson(form, v, tags, url);
  };

  const setTagsSync = (v: string) => {
    setTags(v);
    sincronizarJson(form, alias, v, url);
  };

  const setUrlSync = (v: string) => {
    setUrl(v);
    sincronizarJson(form, alias, tags, v);
  };

  /** Cuando el usuario edita el JSON crudo, parsea y sincroniza el form */
  const onJsonChange = (raw: string) => {
    setJsonText(raw);
    setJsonError(null);
    try {
      const parsed = JSON.parse(raw) as Partial<NuevaObra> & { nombresAlternativos?: string[]; tags?: string[]; obrasRelacionadas?: string[] };
      setForm({
        titulo: parsed.titulo ?? '',
        tipo: parsed.tipo ?? 'manga',
        estado: parsed.estado ?? 'pendiente',
        prioridad: parsed.prioridad ?? 'media',
        url: parsed.url ?? '',
        notas: parsed.notas,
        autor: parsed.autor,
        artista: parsed.artista,
        estadoPublicacion: parsed.estadoPublicacion,
        calificacion: parsed.calificacion,
        obrasRelacionadas: parsed.obrasRelacionadas,
      });
      setAlias((parsed.nombresAlternativos ?? []).join(', '));
      setTags((parsed.tags ?? []).join(', '));
      setUrl(parsed.url ?? '');
    } catch {
      setJsonError('JSON inválido — corrígelo antes de guardar.');
    }
  };

  const guardar = async () => {
    if (modo === 'json' && jsonError) return;
    try {
      await onSave({
        ...form,
        nombresAlternativos: split(alias),
        tags: split(tags),
        url: url.trim() || undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{obra ? 'Editar obra' : 'Nueva obra'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Cancelar</IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={modo} onIonChange={(e) => setModo(e.detail.value as Modo)}>
            <IonSegmentButton value="form">
              <IonIcon icon={createOutline} />
              <IonLabel>Formulario</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="json">
              <IonIcon icon={codeSlash} />
              <IonLabel>JSON</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {modo === 'form' ? (
          <>
            <IonItem>
              <IonLabel position="stacked">Título principal *</IonLabel>
              <IonInput
                value={form.titulo}
                onIonInput={(e) => setField({ titulo: e.detail.value ?? '' })}
                placeholder="Ej. Solo Leveling"
              />
            </IonItem>

            <IonItem>
              <IonLabel>Tipo *</IonLabel>
              <IonSelect value={form.tipo} onIonChange={(e) => setField({ tipo: e.detail.value })}>
                {TIPOS_OBRA.map((t) => <IonSelectOption key={t} value={t}>{t}</IonSelectOption>)}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Estado</IonLabel>
              <IonSelect value={form.estado} onIonChange={(e) => setField({ estado: e.detail.value })}>
                {ESTADOS_OBRA.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Estado Publicación</IonLabel>
              <IonSelect value={form.estadoPublicacion} onIonChange={(e) => setField({ estadoPublicacion: e.detail.value || undefined })}>
                <IonSelectOption value="">Desconocido</IonSelectOption>
                {ESTADOS_PUBLICACION.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Prioridad</IonLabel>
              <IonSelect value={form.prioridad} onIonChange={(e) => setField({ prioridad: e.detail.value })}>
                {PRIORIDADES.map((p) => <IonSelectOption key={p} value={p}>{p}</IonSelectOption>)}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">🔗 URL de lectura actual</IonLabel>
              <IonInput
                value={url}
                type="url"
                onIonInput={(e) => setUrlSync(e.detail.value ?? '')}
                placeholder="https://… (donde estás leyendo ahora)"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Nombres alternativos (coma)</IonLabel>
              <IonInput
                value={alias}
                onIonInput={(e) => setAliasSync(e.detail.value ?? '')}
                placeholder="나 혼자만 레벨업, Only I Level Up"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Tags (coma)</IonLabel>
              <IonInput
                value={tags}
                onIonInput={(e) => setTagsSync(e.detail.value ?? '')}
                placeholder="acción, fantasía"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Autor</IonLabel>
              <IonInput
                value={form.autor ?? ''}
                onIonInput={(e) => setField({ autor: e.detail.value ?? undefined })}
                placeholder="Ej. Chugong"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Artista</IonLabel>
              <IonInput
                value={form.artista ?? ''}
                onIonInput={(e) => setField({ artista: e.detail.value ?? undefined })}
                placeholder="Ej. DUBU"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Calificación (0 a 5)</IonLabel>
              <IonInput
                type="number"
                step="0.5"
                min="0"
                max="5"
                value={form.calificacion ?? ''}
                onIonInput={(e) => {
                  const val = e.detail.value;
                  setField({ calificacion: val ? parseFloat(val) : undefined });
                }}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Obras Relacionadas</IonLabel>
              <IonSelect
                multiple={true}
                value={form.obrasRelacionadas ?? []}
                onIonChange={(e) => setField({ obrasRelacionadas: e.detail.value })}
              >
                {todasObras.filter(o => o.id !== obra?.id).map((o) => (
                  <IonSelectOption key={o.id} value={o.id}>{o.titulo}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Notas</IonLabel>
              <IonTextarea
                value={form.notas}
                onIonInput={(e) => setField({ notas: e.detail.value ?? '' })}
                autoGrow
              />
            </IonItem>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', marginBottom: 4 }}>
              Pega o edita el JSON de la obra. Los cambios se sincronizan con el formulario.
            </p>
            <IonTextarea
              value={jsonText}
              onIonInput={(e) => onJsonChange(e.detail.value ?? '')}
              autoGrow
              rows={20}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
              placeholder={'{\n  "titulo": "Mi Obra",\n  "tipo": "manga",\n  "url": "https://..."\n}'}
            />
            {jsonError && (
              <p style={{ color: 'var(--ion-color-danger)', fontSize: 13 }}>{jsonError}</p>
            )}
          </>
        )}

        {error && <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>}

        <IonButton
          expand="block"
          className="ion-margin-top"
          onClick={guardar}
          disabled={modo === 'json' && !!jsonError}
        >
          Guardar
        </IonButton>
      </IonContent>
    </IonModal>
  );
}

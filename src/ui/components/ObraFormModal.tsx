import { useEffect, useState } from 'react';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonModal,
  IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar,
} from '@ionic/react';
import { NuevaObra } from '@application/ports';
import { Obra } from '@domain/obra';
import { ESTADOS_OBRA, PRIORIDADES, TIPOS_OBRA } from '@domain/types';

interface Props {
  isOpen: boolean;
  obra?: Obra; // si viene, es edición
  onClose: () => void;
  onSave: (input: NuevaObra) => Promise<void>;
}

const vacia: NuevaObra = { titulo: '', tipo: 'manga', estado: 'pendiente', prioridad: 'media' };

export default function ObraFormModal({ isOpen, obra, onClose, onSave }: Props) {
  const [form, setForm] = useState<NuevaObra>(vacia);
  const [alias, setAlias] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (obra) {
      setForm({ titulo: obra.titulo, tipo: obra.tipo, estado: obra.estado, prioridad: obra.prioridad, notas: obra.notas });
      setAlias(obra.nombresAlternativos.join(', '));
      setTags(obra.tags.join(', '));
    } else {
      setForm(vacia); setAlias(''); setTags('');
    }
    setError(null);
  }, [obra, isOpen]);

  const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const guardar = async () => {
    try {
      await onSave({ ...form, nombresAlternativos: split(alias), tags: split(tags) });
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
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Título principal *</IonLabel>
          <IonInput value={form.titulo} onIonInput={(e) => setForm({ ...form, titulo: e.detail.value ?? '' })} placeholder="Ej. Solo Leveling" />
        </IonItem>
        <IonItem>
          <IonLabel>Tipo *</IonLabel>
          <IonSelect value={form.tipo} onIonChange={(e) => setForm({ ...form, tipo: e.detail.value })}>
            {TIPOS_OBRA.map((t) => <IonSelectOption key={t} value={t}>{t}</IonSelectOption>)}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel>Estado</IonLabel>
          <IonSelect value={form.estado} onIonChange={(e) => setForm({ ...form, estado: e.detail.value })}>
            {ESTADOS_OBRA.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel>Prioridad</IonLabel>
          <IonSelect value={form.prioridad} onIonChange={(e) => setForm({ ...form, prioridad: e.detail.value })}>
            {PRIORIDADES.map((p) => <IonSelectOption key={p} value={p}>{p}</IonSelectOption>)}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Nombres alternativos (coma)</IonLabel>
          <IonInput value={alias} onIonInput={(e) => setAlias(e.detail.value ?? '')} placeholder="나 혼자만 레벨업, 我独自升级" />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Tags (coma)</IonLabel>
          <IonInput value={tags} onIonInput={(e) => setTags(e.detail.value ?? '')} placeholder="acción, fantasía" />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Notas</IonLabel>
          <IonTextarea value={form.notas} onIonInput={(e) => setForm({ ...form, notas: e.detail.value ?? '' })} autoGrow />
        </IonItem>

        {error && <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>}
        <IonButton expand="block" className="ion-margin-top" onClick={guardar}>Guardar</IonButton>
      </IonContent>
    </IonModal>
  );
}

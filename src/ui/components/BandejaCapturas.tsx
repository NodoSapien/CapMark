import { useEffect, useState } from 'react';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel,
  IonList, IonModal, IonNote, IonTitle, IonToolbar,
} from '@ionic/react';
import { container } from '@infrastructure/container';
import {
  confirmarRecepcion, escucharCapturas, PropuestaCaptura,
} from '@infrastructure/extension/capturas-listener';
import { useFeedback } from '@ui/hooks/useFeedback';

interface Props {
  /** Called after a capture is registered so the page can refresh its list. */
  onRegistrado: () => void;
}

/** Inbox of captures sent by the browser extension. Nothing is saved until the user confirms (S2). */
export default function BandejaCapturas({ onRegistrado }: Props) {
  const { toastError, toastExito } = useFeedback();
  const [abierta, setAbierta] = useState(false);
  const [items, setItems] = useState<PropuestaCaptura[]>([]);
  const [titulos, setTitulos] = useState<Record<string, string>>({});
  const [capitulos, setCapitulos] = useState<Record<string, string>>({});

  useEffect(
    () =>
      escucharCapturas((nuevas) =>
        setItems((prev) => {
          const vistos = new Set(prev.map((p) => p.captura.id));
          return [...prev, ...nuevas.filter((n) => !vistos.has(n.captura.id))];
        }),
      ),
    [],
  );

  const quitar = (id: string) => {
    setItems((prev) => prev.filter((p) => p.captura.id !== id));
    confirmarRecepcion([id]);
  };

  const registrar = async (p: PropuestaCaptura) => {
    const id = p.captura.id;
    const cap = capitulos[id] ?? (p.capitulo ? String(p.capitulo.capitulo) : '');
    try {
      await container.capturas.confirmar(p.captura, {
        titulo: titulos[id] ?? p.captura.titulo,
        capitulo: cap.trim() === '' ? undefined : Number(cap),
      });
      quitar(id);
      toastExito('Registrado');
      onRegistrado();
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo registrar');
    }
  };

  if (items.length === 0 && !abierta) return null;

  return (
    <>
      <IonButton onClick={() => setAbierta(true)} aria-label="Capturas pendientes">
        Capturas <IonBadge color="danger" style={{ marginLeft: 4 }}>{items.length}</IonBadge>
      </IonButton>
      <IonModal isOpen={abierta} onDidDismiss={() => setAbierta(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Capturas pendientes</IonTitle>
            <IonButtons slot="end"><IonButton onClick={() => setAbierta(false)}>Cerrar</IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {items.length === 0 && <IonNote className="ion-padding">No hay capturas pendientes.</IonNote>}
          <IonList>
            {items.map((p) => (
              <IonItem key={p.captura.id} lines="full">
                <IonLabel className="ion-text-wrap">
                  <IonInput
                    label="Título"
                    labelPlacement="stacked"
                    value={titulos[p.captura.id] ?? p.captura.titulo}
                    onIonInput={(e) => setTitulos((t) => ({ ...t, [p.captura.id]: String(e.detail.value ?? '') }))}
                  />
                  <IonInput
                    label={p.capitulo ? `Capítulo (detectado: ${p.capitulo.etiqueta}, confianza ${p.capitulo.confianza})` : 'Capítulo'}
                    labelPlacement="stacked"
                    type="number"
                    value={capitulos[p.captura.id] ?? (p.capitulo ? String(p.capitulo.capitulo) : '')}
                    onIonInput={(e) => setCapitulos((c) => ({ ...c, [p.captura.id]: String(e.detail.value ?? '') }))}
                  />
                  <IonNote>{p.captura.url}</IonNote>
                  <div>
                    <IonButton size="small" onClick={() => void registrar(p)}>Registrar</IonButton>
                    <IonButton size="small" fill="outline" color="medium" onClick={() => quitar(p.captura.id)}>
                      Descartar
                    </IonButton>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
}

import { useState } from 'react';
import {
  IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonChip, IonContent, IonHeader, IonIcon, IonItem, IonLabel,
  IonList, IonListHeader, IonNote, IonPage, IonText, IonTitle, IonToolbar, useIonAlert,
  useIonToast, useIonViewWillEnter,
} from '@ionic/react';
import {
  addCircleOutline, checkmarkCircle, createOutline, openOutline, refreshOutline,
  searchCircleOutline, star, starOutline, trashOutline,
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { NuevaObra } from '@application/ports';
import { Fuente } from '@domain/fuente';
import { Obra } from '@domain/obra';
import { ProgresoEntry } from '@domain/progreso';
import { container } from '@infrastructure/container';
import ObraFormModal from '@ui/components/ObraFormModal';
import { capFmt, colorEstado, colorPrioridad, fechaCorta } from '@ui/format';

export default function ObraDetallePage() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [toast] = useIonToast();

  const [obra, setObra] = useState<Obra>();
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [historial, setHistorial] = useState<ProgresoEntry[]>([]);
  const [editar, setEditar] = useState(false);

  const cargar = async () => {
    setObra(await container.catalogo.obtener(id));
    setFuentes(await container.fuentes.listar(id));
    setHistorial(await container.progreso.historial(id));
  };
  useIonViewWillEnter(() => { void cargar(); });

  const actual = historial[0];

  // RNF-002: actualizar capítulo en ≤ 3 toques (botón +1 = 1 toque).
  const avanzar = async (delta: number) => {
    const base = actual?.capitulo ?? 0;
    await container.progreso.registrar(id, { capitulo: Math.max(0, base + delta) });
    await cargar();
  };

  const fijarCapitulo = () =>
    presentAlert({
      header: 'Fijar capítulo',
      inputs: [
        { name: 'capitulo', type: 'number', placeholder: 'Capítulo (admite 10.5)', value: actual?.capitulo },
        { name: 'punto', type: 'text', placeholder: 'Página / punto (opcional)' },
      ],
      buttons: [
        'Cancelar',
        {
          text: 'Guardar',
          handler: async (d) => {
            await container.progreso.fijar(id, { capitulo: Number.parseFloat(d.capitulo), punto: d.punto });
            await cargar();
          },
        },
      ],
    });

  const guardarEdicion = async (input: NuevaObra) => {
    await container.catalogo.editar(id, input);
    await cargar();
  };

  const eliminarObra = () =>
    presentAlert({
      header: 'Eliminar obra',
      message: 'Se borrarán también sus fuentes e historial. ¿Continuar?',
      buttons: [
        'Cancelar',
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await container.catalogo.eliminar(id);
            history.replace('/catalogo');
          },
        },
      ],
    });

  const agregarFuente = () =>
    presentAlert({
      header: 'Nueva fuente',
      inputs: [
        { name: 'nombre', type: 'text', placeholder: 'Nombre en el sitio' },
        { name: 'url', type: 'url', placeholder: 'https://...' },
      ],
      buttons: [
        'Cancelar',
        {
          text: 'Agregar',
          handler: async (d) => {
            try {
              setFuentes(await container.fuentes.agregar(id, { nombreEnSitio: d.nombre, url: d.url }));
            } catch (e) {
              toast({ message: e instanceof Error ? e.message : 'URL inválida', duration: 2500, color: 'danger' });
            }
          },
        },
      ],
    });

  const verificar = async (f: Fuente) => {
    toast({ message: `Verificando ${f.nombreEnSitio}…`, duration: 1200 });
    setFuentes(await container.fuentes.verificar(id, f.id));
  };

  // Scraper OPT-IN: propone y el usuario confirma antes de registrar (semi-asistido, S2).
  const detectar = async (f: Fuente) => {
    toast({ message: 'Leyendo la fuente…', duration: 1200 });
    const p = await container.scraper.detectar(f.url).catch(() => undefined);
    if (!p) {
      toast({ message: 'No se pudo detectar el capítulo en esa fuente.', duration: 2500, color: 'warning' });
      return;
    }
    presentAlert({
      header: 'Capítulo detectado',
      message: `Propuesta: capítulo ${capFmt(p.capitulo)} (confianza ${p.confianza}${p.etiqueta ? `, "${p.etiqueta}"` : ''}). ¿Registrarlo como tu punto actual?`,
      buttons: [
        'Descartar',
        {
          text: 'Registrar',
          handler: async () => {
            await container.progreso.registrar(id, { capitulo: p.capitulo });
            await cargar();
          },
        },
      ],
    });
  };

  const marcarPrincipal = async (f: Fuente) => setFuentes(await container.fuentes.marcarPrincipal(id, f.id));
  const eliminarFuente = async (f: Fuente) => setFuentes(await container.fuentes.eliminar(id, f.id));
  const abrir = (f: Fuente) => window.open(f.url, '_blank', 'noopener');
  const eliminarProgreso = async (progresoId: string) => {
    await container.progreso.eliminar(progresoId);
    toast({ message: 'Registro de progreso eliminado', duration: 1500 });
    await cargar();
  };

  if (!obra) {
    return (
      <IonPage>
        <IonContent className="ion-padding"><p className="muted">Cargando…</p></IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/catalogo" /></IonButtons>
          <IonTitle>{obra.titulo}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setEditar(true)}><IonIcon slot="icon-only" icon={createOutline} /></IonButton>
            <IonButton color="danger" onClick={eliminarObra}><IonIcon slot="icon-only" icon={trashOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ marginBottom: 8 }}>
          <IonBadge className="estado-badge" color={colorEstado[obra.estado]}>{obra.estado}</IonBadge>{' '}
          <IonBadge color={colorPrioridad[obra.prioridad]}>{obra.prioridad}</IonBadge>{' '}
          <IonNote>{obra.tipo}</IonNote>
        </div>
        {obra.url && (
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <IonNote style={{ fontSize: 12, wordBreak: 'break-all', flex: 1 }}>
              🔗 {obra.url}
            </IonNote>
            <IonButton size="small" fill="outline" onClick={() => window.open(obra.url, '_blank', 'noopener')}>
              <IonIcon slot="start" icon={openOutline} />
              Abrir
            </IonButton>
          </div>
        )}
        {obra.nombresAlternativos.length > 0 && (
          <p className="muted">También: {obra.nombresAlternativos.join(' · ')}</p>
        )}
        <div>{obra.tags.map((t) => <IonChip key={t} outline>{t}</IonChip>)}</div>
        {obra.notas && <IonText><p>{obra.notas}</p></IonText>}

        {/* Progreso (RF-011/012, RNF-002) */}
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle>Punto actual</IonCardSubtitle>
            <IonCardTitle>
              <span className="big-cap">Cap. {capFmt(actual?.capitulo)}</span>
              {actual?.punto && <IonNote> · {actual.punto}</IonNote>}
            </IonCardTitle>
            <IonNote>Última lectura: {fechaCorta(actual?.registradoEn)}</IonNote>
          </IonCardHeader>
          <IonCardContent>
            <IonButton onClick={() => avanzar(1)}>+1 capítulo</IonButton>
            <IonButton fill="outline" onClick={fijarCapitulo}>Fijar…</IonButton>
          </IonCardContent>
        </IonCard>

        {/* Fuentes (RF-008/009/010/017 + scraper opt-in) */}
        <IonList>
          <IonListHeader>
            <IonLabel>Fuentes</IonLabel>
            <IonButton onClick={agregarFuente}><IonIcon slot="start" icon={addCircleOutline} />Agregar</IonButton>
          </IonListHeader>
          {fuentes.length === 0 && <IonItem lines="none"><IonNote>Sin fuentes aún.</IonNote></IonItem>}
          {fuentes.map((f) => (
            <IonItem key={f.id} className={f.estadoVerificacion === 'caida' ? 'fuente-caida' : ''}>
              <IonIcon
                slot="start"
                icon={f.esPrincipal ? star : starOutline}
                color={f.esPrincipal ? 'warning' : 'medium'}
                onClick={() => marcarPrincipal(f)}
                title="Marcar principal"
              />
              <IonLabel>
                <h3>{f.nombreEnSitio}</h3>
                <p className="muted">
                  {f.estadoVerificacion === 'activa' && <IonIcon icon={checkmarkCircle} color="success" />}{' '}
                  {f.estadoVerificacion}{f.verificadaEn ? ` · ${fechaCorta(f.verificadaEn)}` : ''}
                </p>
              </IonLabel>
              <IonButtons slot="end">
                <IonButton onClick={() => detectar(f)} title="Detectar capítulo (opt-in)"><IonIcon slot="icon-only" icon={searchCircleOutline} /></IonButton>
                <IonButton onClick={() => verificar(f)} title="Verificar link"><IonIcon slot="icon-only" icon={refreshOutline} /></IonButton>
                <IonButton onClick={() => abrir(f)} title="Abrir"><IonIcon slot="icon-only" icon={openOutline} /></IonButton>
                <IonButton color="danger" onClick={() => eliminarFuente(f)}><IonIcon slot="icon-only" icon={trashOutline} /></IonButton>
              </IonButtons>
            </IonItem>
          ))}
        </IonList>

        {/* Historial (RF-012) */}
        <IonList>
          <IonListHeader><IonLabel>Historial de progreso</IonLabel></IonListHeader>
          {historial.length === 0 && <IonItem lines="none"><IonNote>Sin registros.</IonNote></IonItem>}
          {historial.map((h) => (
            <IonItem key={h.id}>
              <IonLabel>
                <h3 className="cap-actual">Cap. {capFmt(h.capitulo)}</h3>
                {h.punto && <p className="muted">{h.punto}</p>}
              </IonLabel>
              <IonNote slot="end" style={{ marginRight: '8px' }}>{fechaCorta(h.registradoEn)}</IonNote>
              <IonButton 
                slot="end" 
                color="danger" 
                fill="clear" 
                onClick={() => eliminarProgreso(h.id)} 
                title="Deshacer (Eliminar registro)"
              >
                <IonIcon slot="icon-only" icon={trashOutline} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>
      </IonContent>

      <ObraFormModal isOpen={editar} obra={obra} onClose={() => setEditar(false)} onSave={guardarEdicion} />
    </IonPage>
  );
}

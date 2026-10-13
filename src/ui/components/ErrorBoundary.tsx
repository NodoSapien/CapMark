import { Component, ErrorInfo, ReactNode } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { alertCircleOutline, refreshOutline } from 'ionicons/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary capturó un fallo no controlado:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <IonPage>
          <IonHeader>
            <IonToolbar color="danger">
              <IonTitle>Ocurrió un error inesperado</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding ion-text-center">
            <div style={{ marginTop: '20vh' }}>
              <IonIcon
                icon={alertCircleOutline}
                color="danger"
                style={{ fontSize: '64px', marginBottom: '16px' }}
              />
              <h2>La aplicación encontró un problema</h2>
              <p className="muted" style={{ maxWidth: '480px', margin: '0 auto 24px auto' }}>
                {this.state.error?.message || 'Error de renderizado no controlado.'}
              </p>
              <IonButton fill="solid" color="primary" onClick={this.handleRetry}>
                <IonIcon slot="start" icon={refreshOutline} />
                Recargar aplicación
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}

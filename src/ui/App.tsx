import { lazy, Suspense } from 'react';
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Redirect, Route } from 'react-router-dom';

// Rutas con carga diferida: cada página es su propio chunk (bundle inicial más liviano).
const CatalogoPage = lazy(() => import('@ui/pages/CatalogoPage'));
const ObraDetallePage = lazy(() => import('@ui/pages/ObraDetallePage'));

const Cargando = () => (
  <div className="ion-text-center ion-padding"><IonSpinner /></div>
);

// El clientId viene de VITE_GOOGLE_CLIENT_ID en .env (ver .env.example).
// Sin él, la app sigue funcionando en modo solo-local; el botón de sync no aparece.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function App() {
  const app = (
    <IonApp>
      <IonReactRouter>
        <Suspense fallback={<Cargando />}>
          <IonRouterOutlet>
            <Route exact path="/catalogo" component={CatalogoPage} />
            <Route exact path="/obra/:id" component={ObraDetallePage} />
            <Route exact path="/">
              <Redirect to="/catalogo" />
            </Route>
          </IonRouterOutlet>
        </Suspense>
      </IonReactRouter>
    </IonApp>
  );

  // Si no hay Client ID configurado, la app funciona igual en modo solo-local.
  if (!GOOGLE_CLIENT_ID) return app;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {app}
    </GoogleOAuthProvider>
  );
}

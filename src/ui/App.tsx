import { lazy, Suspense } from 'react';
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';

// Rutas con carga diferida: cada página es su propio chunk (bundle inicial más liviano).
const CatalogoPage = lazy(() => import('@ui/pages/CatalogoPage'));
const ObraDetallePage = lazy(() => import('@ui/pages/ObraDetallePage'));

const Cargando = () => (
  <div className="ion-text-center ion-padding"><IonSpinner /></div>
);

export default function App() {
  return (
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
}

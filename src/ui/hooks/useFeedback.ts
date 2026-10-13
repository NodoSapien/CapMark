import { useIonAlert, useIonToast } from '@ionic/react';
import { useCallback } from 'react';

export function useFeedback() {
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const toastError = useCallback(
    (mensaje: string) => {
      void presentToast({
        message: mensaje,
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
    },
    [presentToast],
  );

  const toastExito = useCallback(
    (mensaje: string) => {
      void presentToast({
        message: mensaje,
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
    },
    [presentToast],
  );

  const toastAviso = useCallback(
    (mensaje: string) => {
      void presentToast({
        message: mensaje,
        duration: 2500,
        color: 'warning',
        position: 'bottom',
      });
    },
    [presentToast],
  );

  const ejecutarAccion = useCallback(
    async <T>(
      accion: () => Promise<T>,
      opciones: {
        mensajeExito?: string;
        mensajeError?: string;
      } = {},
    ): Promise<T | undefined> => {
      try {
        const resultado = await accion();
        if (opciones.mensajeExito) {
          toastExito(opciones.mensajeExito);
        }
        return resultado;
      } catch (err: unknown) {
        console.error('Error durante la ejecución de acción UI:', err);
        const mensaje =
          err instanceof Error
            ? err.message
            : opciones.mensajeError || 'Ocurrió un error inesperado al procesar la solicitud.';
        toastError(mensaje);
        return undefined;
      }
    },
    [toastExito, toastError],
  );

  return {
    presentAlert,
    toastError,
    toastExito,
    toastAviso,
    ejecutarAccion,
  };
}

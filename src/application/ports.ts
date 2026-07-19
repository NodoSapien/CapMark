// Puertos: interfaces que la capa de aplicación necesita. Los adaptadores concretos
// (SQLite/Dexie, Supabase, scraper HTTP...) viven en infraestructura. Así el backend
// de sincronización o la persistencia son sustituibles sin tocar la lógica (RNF-009).

import { Fuente, NuevaFuente } from '@domain/fuente';
import { NuevaObra, Obra } from '@domain/obra';
import { NuevoProgreso, ProgresoEntry } from '@domain/progreso';
import { EstadoFuente } from '@domain/types';

export interface IdGen {
  nuevo(): string;
}

export interface Reloj {
  ahora(): Date;
}

/** Persistencia de las tres agregados. Local-first: los adaptadores confirman en local
 *  antes de sincronizar (RNF-004, RNF-007). */
export interface Repositorio {
  // Obras
  guardarObra(obra: Obra): Promise<void>;
  obtenerObra(id: string): Promise<Obra | undefined>;
  listarObras(): Promise<Obra[]>;
  eliminarObra(id: string): Promise<void>; // borra en cascada fuentes + progreso (RF-006)
  // Fuentes
  guardarFuentes(obraId: string, fuentes: Fuente[]): Promise<void>;
  listarFuentes(obraId: string): Promise<Fuente[]>;
  // Progreso
  agregarProgreso(entry: ProgresoEntry): Promise<void>;
  listarProgreso(obraId: string): Promise<ProgresoEntry[]>;
}

/** RF-017 / RNF-008: verifica del lado servidor si una URL responde (≤ 5 s, no bloqueante). */
export interface LinkVerifier {
  verificar(url: string): Promise<{ estado: EstadoFuente; verificadaEn: string }>;
}

/** Módulo scraper opt-in (decisión del usuario): dado un HTML/URL de fuente, PROPONE
 *  el capítulo detectado. Nunca escribe; la app pide confirmación antes de guardar. */
export interface PropuestaCapitulo {
  capitulo: number;
  etiqueta?: string; // texto crudo detectado, p. ej. "Capítulo 42"
  confianza: 'alta' | 'media' | 'baja';
  fuenteUrl: string;
}

export interface SourceScraper {
  /** ¿Este adaptador sabe leer este dominio? */
  soporta(url: string): boolean;
  /** Devuelve una propuesta de capítulo, o undefined si no logra detectarlo. */
  detectar(url: string): Promise<PropuestaCapitulo | undefined>;
}

/** Sincronización opcional con un backend auto-instanciable. La app funciona sin él. */
export interface SyncPort {
  push(): Promise<void>;
  pull(): Promise<void>;
  /** ¿Hay un backend configurado? (barato, solo mira configuración). */
  disponible(): boolean;
  /** ¿El backend responde AHORA? (red, con timeout). Nunca lanza: si falla, es `false`
   *  y la app sigue en local. Base del aviso "No se puede sincronizar" (RNF-004). */
  probarConexion(): Promise<boolean>;
}

/** Autenticación opcional con un proveedor externo (Google). La app funciona sin él. */
export interface AuthPort {
  getToken(): string | null;
  setToken(token: string, userEmail?: string): void;
  getUserEmail(): string | null;
  logout(): void;
}

export type { NuevaObra, NuevaFuente, NuevoProgreso };

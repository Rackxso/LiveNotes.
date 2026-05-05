export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: Date;
  hora?: string;
  recurrenceType?: RecurrenceType;
  recurrenceEnd?: Date;
}

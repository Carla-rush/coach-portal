export type FrictionCategory =
  | 'None'
  | 'Work'
  | 'Social'
  | 'Health'
  | 'Internal'
  | 'Finance'
  | 'Time';

export interface DailyReflection {
    id?: string;
    clientId: string;
    date: string;
    wins: string;
    pivot: string;
    frictionCat: FrictionCategory;
    frictionNote: string;
    energyLevel: number;
    satisfaction: number;
}
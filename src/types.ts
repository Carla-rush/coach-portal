export type FrictionCategory = 
  | 'Social/Environment' 
  | 'Work/Schedule' 
  | 'Mental/Emotional' 
  | 'Physical/Health' 
  | 'Logistical/Prep' 
  | 'Other' 
  | 'None';

export interface DailyReflection {
    id?: string;             
    clientId: string;        
    date: string;            
    wins: string;            
    frictionCat: FrictionCategory; 
    frictionNote: string;    
    planAlignment: number;   
    energyLevel: number;     
    satisfaction: number;    
}
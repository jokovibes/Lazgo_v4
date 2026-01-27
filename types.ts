
export interface StudentData {
  name: string;
  className: string;
  arrivalTime: string;
  reason?: string;
}

export enum TardinessCategory {
  Ringan = 'Ringan', // Mild
  Sedang = 'Sedang', // Moderate
  Berat = 'Berat',   // Severe
}

export interface TardinessRecord extends StudentData {
  id: string;
  schoolStartTime: string;
  durationMinutes: number;
  category: TardinessCategory;
}

export interface GeneratedOutput {
  summary: string;
  whatsapp: string;
  dailyRecap: string;
}

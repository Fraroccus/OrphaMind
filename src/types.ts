export enum Frequency {
  OBLIGATORY = "Obligatory/Always",
  FREQUENT = "Frequent",
  OCCASIONAL = "Occasional",
}

export const FrequencyWeight: Record<Frequency, number> = {
  [Frequency.OBLIGATORY]: 1.0,
  [Frequency.FREQUENT]: 0.7,
  [Frequency.OCCASIONAL]: 0.3,
};

export interface Symptom {
  id: string;
  name: string;
  frequency: Frequency;
}

export interface GeneticTest {
  geneSymbol: string;
  method: string;
}

export interface Disease {
  id: string;
  name: string;
  category: string;
  orphanetId: string;
  symptoms: Symptom[];
  geneticTests: GeneticTest[];
  matchScore?: number;
  description?: string;
}

export interface ConsultationState {
  step: 'initial' | 'refining' | 'results';
  category: string;
  initialSymptoms: string;
  refinedSymptoms: string[];
  candidates: Disease[];
}

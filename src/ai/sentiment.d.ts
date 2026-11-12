export interface SentimentModel {
  schema_version: number;
  status: string;
  algorithm: string;
  labels: ('negatif' | 'netral' | 'positif')[];
  aliases: Record<string, string>;
  vocabulary: Record<string, number>;
  idf: number[];
  weights: number[][];
  bias: number[];
  preprocessing: string;
  training_data?: string;
}

export interface SentimentResult {
  label: 'negatif' | 'netral' | 'positif' | null;
  status: 'predicted' | 'unknown_vocabulary' | 'empty_input';
  scores: number[] | null;
  scoreType: 'decision_margin' | 'log_score' | 'none';
  experimental: boolean;
}

export function createSentimentClassifier(
  model: SentimentModel
): (text: string) => SentimentResult;

export interface TopProvider {
  /** Provider identifier slug */
  slug: string;
  /** Human readable provider name */
  name?: string;
  context_length?: number;
  max_completion_tokens?: number;
  is_moderated: boolean;
}


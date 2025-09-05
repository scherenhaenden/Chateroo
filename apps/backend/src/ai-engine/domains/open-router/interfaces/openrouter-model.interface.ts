import { Architecture } from './architecture.interface';
import { Pricing } from './pricing.interface';
import { TopProvider } from './top-provider.interface';

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id?: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: Architecture;
  pricing: Pricing;
  top_provider: TopProvider;
  per_request_limits: any;
  supported_parameters: string[];
}

export interface OpenRouterProvider {
  name: string;
  slug: string;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  status_page_url?: string;
}

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id?: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    request?: string;
    image?: string;
    web_search?: string;
    internal_reasoning?: string;
    input_cache_read?: string;
    audio?: string;
    input_cache_write?: string;
  };
  top_provider: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits: any;
  supported_parameters: string[];
}

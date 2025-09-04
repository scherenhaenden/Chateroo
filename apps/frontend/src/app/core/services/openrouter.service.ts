import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OpenRouterModel, OpenRouterProvider } from '../../models/openrouter.model';

@Injectable({
  providedIn: 'root'
})
export class OpenRouterService {
  private readonly apiUrl: string = 'http://localhost:3000/api/chat';

  public constructor(private readonly http: HttpClient) {}

  /**
   * Gets available OpenRouter models
   */
  public getModels(apiKey: string): Observable<OpenRouterModel[]> {
    return this.http.get<OpenRouterModel[]>(`${this.apiUrl}/openrouter/models`, {
      headers: apiKey ? { 'X-API-Key': apiKey } : {}
    });
  }

  /**
   * Gets available OpenRouter providers
   */
  public getProviders(): Observable<OpenRouterProvider[]> {
    return this.http.get<OpenRouterProvider[]>(`${this.apiUrl}/openrouter/providers`);
  }

  /**
   * Extracts provider name from model ID (e.g., "openai/gpt-4" -> "openai")
   */
  public extractProviderFromModelId(modelId: string): string {
    return modelId.split('/')[0] || 'unknown';
  }

  /**
   * Filters models by provider
   */
  public filterModelsByProvider(models: OpenRouterModel[], provider: string): OpenRouterModel[] {
    return models.filter(model =>
      this.extractProviderFromModelId(model.id) === provider
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Gets unique provider names from models
   */
  public getProvidersFromModels(models: OpenRouterModel[]): string[] {
    return Array.from(
      new Set(models.map(model => this.extractProviderFromModelId(model.id)))
    ).sort();
  }
}

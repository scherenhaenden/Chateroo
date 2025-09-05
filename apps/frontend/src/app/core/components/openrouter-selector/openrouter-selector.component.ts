import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OpenRouterService } from '../../services/openrouter.service';
import { SettingsService } from '../../services/settings.service';
import { OpenRouterModel } from '../../../models/openrouter.model';
import { AutocompleteComponent, AutocompleteOption } from '../autocomplete/autocomplete.component';

export interface OpenRouterSelection {
  provider: string;
  model: string;
}

@Component({
  selector: 'app-openrouter-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AutocompleteComponent],
  template: `
    <div class="space-y-4">
      <!-- Provider Dropdown -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Provider
        </label>
        <app-autocomplete
          [options]="providerOptions"
          [placeholder]="'Select OpenRouter provider'"
          [disabled]="isLoading"
          (selectionChange)="onProviderSelect($event)"
        />
      </div>

      <!-- Model Dropdown -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Model
        </label>
        <app-autocomplete
          [options]="modelOptions"
          [placeholder]="'Select model'"
          [disabled]="isLoading || !selectedProvider"
          (selectionChange)="onModelSelect($event)"
        />
      </div>

      <!-- Loading indicator -->
      <div *ngIf="isLoading" class="text-sm text-gray-500 dark:text-gray-400">
        Loading OpenRouter models...
      </div>

      <!-- Error message -->
      <div *ngIf="errorMessage" class="text-sm text-red-600 dark:text-red-400">
        {{ errorMessage }}
      </div>
    </div>
  `
})
export class OpenRouterSelectorComponent implements OnInit, OnDestroy {
  @Input() apiKey: string = '';
  @Output() selectionChange = new EventEmitter<OpenRouterSelection>();

  public isLoading = false;
  public errorMessage = '';
  public selectedProvider = '';
  public selectedModel = '';

  public providerOptions: AutocompleteOption[] = [];
  public modelOptions: AutocompleteOption[] = [];

  private allModels: OpenRouterModel[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private openRouterService: OpenRouterService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.loadModels();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Loads OpenRouter models and sets up provider options
   */
  public loadModels(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Get API key from input or settings
    const apiKey = this.apiKey || this.settingsService.getApiKey('openrouter') || '';

    const subscription = this.openRouterService.getModels(apiKey).subscribe({
      next: (models) => {
        this.allModels = models.sort((a, b) => a.name.localeCompare(b.name));
        this.setupProviderOptions();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading OpenRouter models:', error);
        this.errorMessage = 'Failed to load OpenRouter models. Please check your API key.';
        this.isLoading = false;
        this.allModels = [];
        this.providerOptions = [];
        this.modelOptions = [];
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Sets up provider options from loaded models
   */
  private setupProviderOptions(): void {
    const providers = this.openRouterService.getProvidersFromModels(this.allModels);
    this.providerOptions = providers.map(provider => ({
      value: provider,
      label: provider
    }));

    // Auto-select first provider if available
    if (providers.length > 0) {
      this.selectedProvider = providers[0];
      this.setupModelOptions(this.selectedProvider);
    }
  }

  /**
   * Sets up model options for the selected provider
   */
  private setupModelOptions(provider: string): void {
    const filteredModels = this.openRouterService.filterModelsByProvider(this.allModels, provider);
    this.modelOptions = filteredModels.map(model => ({
      value: model.id,
      label: model.name
    }));

    // Auto-select first model if available
    if (filteredModels.length > 0) {
      this.selectedModel = filteredModels[0].id;
      this.emitSelection();
    } else {
      this.selectedModel = '';
      this.emitSelection();
    }
  }

  /**
   * Handles provider selection
   */
  public onProviderSelect(option: AutocompleteOption | null): void {
    if (option) {
      this.selectedProvider = option.value;
      this.setupModelOptions(this.selectedProvider);
    } else {
      this.selectedProvider = '';
      this.selectedModel = '';
      this.modelOptions = [];
      this.emitSelection();
    }
  }

  /**
   * Handles model selection
   */
  public onModelSelect(option: AutocompleteOption | null): void {
    if (option) {
      this.selectedModel = option.value;
    } else {
      this.selectedModel = '';
    }
    this.emitSelection();
  }

  /**
   * Emits the current selection
   */
  private emitSelection(): void {
    this.selectionChange.emit({
      provider: this.selectedProvider,
      model: this.selectedModel
    });
  }

  /**
   * Reloads models when API key changes
   */
  public refreshModels(): void {
    this.loadModels();
  }
}

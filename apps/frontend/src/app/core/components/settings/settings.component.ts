import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  public settingsForm!: FormGroup;

  public constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
  ) {
    this.settingsForm = this.fb.group({
      openAiApiKey: [''],
      openRouterApiKey: [''],
    });
  }

  public async ngOnInit(): Promise<void> {
    await this.settingsService.load();
    const currentSettings = this.settingsService.getSettings();
    this.settingsForm.patchValue({
      openAiApiKey: currentSettings.openAiApiKey || '',
      openRouterApiKey: currentSettings.openRouterApiKey || '',
    });
  }

  public async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) return;
    await this.settingsService.save(this.settingsForm.value);
    alert('Settings saved!');
  }
}


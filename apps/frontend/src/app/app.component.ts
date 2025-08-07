import { Component } from '@angular/core';
import { LayoutComponent } from './core/components/layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent],
  template: `<app-layout></app-layout>`,
})
export class AppComponent {}


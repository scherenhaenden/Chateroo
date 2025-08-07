import { Routes } from '@angular/router';

// Import the components that will serve as our pages
import { ChatComponent } from './core/components/chat/chat.component';
import { SettingsComponent } from './core/components/settings/settings.component';
import { CanvasComponent } from './core/components/canvas/canvas.component';

export const routes: Routes = [
  // Default route redirects to /chat
  { path: '', redirectTo: '/chat', pathMatch: 'full' },

  // Feature routes
  { path: 'chat', component: ChatComponent, title: 'Chateroo - Chat' },
  { path: 'settings', component: SettingsComponent, title: 'Chateroo - Settings' },
  { path: 'canvas', component: CanvasComponent, title: 'Chateroo - Canvas' },

  // Wildcard route for 404 Not Found (optional but good practice)
  // { path: '**', component: PageNotFoundComponent },
];


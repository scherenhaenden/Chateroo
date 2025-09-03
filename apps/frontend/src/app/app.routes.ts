import { Routes } from '@angular/router';

// Import the components that will serve as our pages
import { ChatComponent } from './core/components/chat/chat.component';
import { SettingsComponent } from './core/components/settings/settings.component';
import { LoginComponent } from './core/components/login/login.component';
import { RegisterComponent } from './core/components/register/register.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default route redirects to /chat
  { path: '', redirectTo: '/chat', pathMatch: 'full' },

  // Auth routes (only for non-logged-in users)
  { path: 'login', component: LoginComponent, canActivate: [guestGuard], title: 'Chateroo - Login' },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard], title: 'Chateroo - Register' },

  // Publicly accessible routes (no auth guard anymore)
  { path: 'chat', component: ChatComponent, title: 'Chateroo - Chat' },
  { path: 'settings', component: SettingsComponent, title: 'Chateroo - Settings' },

  // Wildcard route for 404 Not Found (optional but good practice)
  // { path: '**', component: PageNotFoundComponent },
];

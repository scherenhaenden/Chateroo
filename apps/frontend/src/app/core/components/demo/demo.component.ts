import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CopyBoxComponent } from '../copy-box/copy-box.component';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, CopyBoxComponent],
  templateUrl: './demo.component.html',
})
export class DemoComponent {
  public htmlExample = `<button onclick=\"alert('Hola!')\">Presióname</button>`;
  public bashExample = `echo \"Hola mundo\"`;
}

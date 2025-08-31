import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatAttachment } from '../../../models/chat.model';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <input
        #fileInput
        type="file"
        multiple
        [accept]="acceptedTypes"
        (change)="onFileSelected($event)"
        class="hidden"
      />

      <button
        type="button"
        (click)="fileInput.click()"
        [disabled]="isUploading"
        class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        title="Datei anhängen"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
        </svg>
      </button>

      <!-- Upload Progress -->
      <div *ngIf="isUploading" class="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    </div>

    <!-- Attached Files Preview -->
    <div *ngIf="attachments.length > 0" class="mt-2 space-y-2">
      <div *ngFor="let attachment of attachments; trackBy: trackByAttachmentId"
           class="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">

        <!-- Image Preview -->
        <div *ngIf="attachment.isImage" class="flex-shrink-0">
          <img [src]="attachment.url" [alt]="attachment.name"
               class="w-10 h-10 object-cover rounded border">
        </div>

        <!-- File Icon -->
        <div *ngIf="!attachment.isImage" class="flex-shrink-0">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>

        <!-- File Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ attachment.name }}</p>
          <p class="text-xs text-gray-500">{{ formatFileSize(attachment.size) }}</p>
        </div>

        <!-- Remove Button -->
        <button
          type="button"
          (click)="removeAttachment(attachment.id)"
          class="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Datei entfernen"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class FileUploadComponent {
  @Input() acceptedTypes = 'image/*,.pdf,.txt,.doc,.docx,.json,.csv,.md';
  @Input() maxFileSize = 10 * 1024 * 1024; // 10MB
  @Input() maxFiles = 5;

  @Output() attachmentsChange = new EventEmitter<ChatAttachment[]>();
  @Output() error = new EventEmitter<string>();

  public attachments: ChatAttachment[] = [];
  public isUploading = false;

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    // Check file count limit
    if (this.attachments.length + files.length > this.maxFiles) {
      this.error.emit(`Maximal ${this.maxFiles} Dateien erlaubt`);
      return;
    }

    this.isUploading = true;
    const filePromises: Promise<ChatAttachment>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > this.maxFileSize) {
        this.error.emit(`Datei "${file.name}" ist zu groß (max. ${this.formatFileSize(this.maxFileSize)})`);
        continue;
      }

      filePromises.push(this.processFile(file));
    }

    Promise.all(filePromises)
      .then((newAttachments) => {
        this.attachments.push(...newAttachments.filter(a => a !== null));
        this.attachmentsChange.emit(this.attachments);
      })
      .catch((error) => {
        this.error.emit('Fehler beim Verarbeiten der Dateien: ' + error.message);
      })
      .finally(() => {
        this.isUploading = false;
        input.value = ''; // Reset input
      });
  }

  private processFile(file: File): Promise<ChatAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix

        const attachment: ChatAttachment = {
          id: this.generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: result, // For preview
          base64: base64, // For API
          isImage: file.type.startsWith('image/')
        };

        resolve(attachment);
      };

      reader.onerror = () => {
        reject(new Error(`Fehler beim Lesen der Datei "${file.name}"`));
      };

      reader.readAsDataURL(file);
    });
  }

  public removeAttachment(id: string): void {
    this.attachments = this.attachments.filter(a => a.id !== id);
    this.attachmentsChange.emit(this.attachments);
  }

  public clearAttachments(): void {
    this.attachments = [];
    this.attachmentsChange.emit(this.attachments);
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public trackByAttachmentId(index: number, attachment: ChatAttachment): string {
    return attachment.id;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

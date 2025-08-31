import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatAttachment } from '../../../models/chat.model';

@Component({
  selector: 'app-attachment-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="attachments && attachments.length > 0" class="mt-3 space-y-2">
      <div *ngFor="let attachment of attachments; trackBy: trackByAttachmentId"
           class="border rounded-lg overflow-hidden bg-gray-50">

        <!-- Image Display -->
        <div *ngIf="attachment.isImage" class="relative">
          <img
            [src]="attachment.url"
            [alt]="attachment.name"
            class="max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
            (click)="openImageModal(attachment)"
          >
          <div class="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {{ attachment.name }}
          </div>
        </div>

        <!-- Non-Image File Display -->
        <div *ngIf="!attachment.isImage" class="p-3 flex items-center space-x-3">
          <div class="flex-shrink-0">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">{{ attachment.name }}</p>
            <p class="text-sm text-gray-500">{{ getFileTypeDescription(attachment.type) }} • {{ formatFileSize(attachment.size) }}</p>
          </div>
          <div class="flex-shrink-0">
            <button
              (click)="downloadFile(attachment)"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Herunterladen
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Modal -->
    <div *ngIf="selectedImage"
         class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
         (click)="closeImageModal()">
      <div class="relative max-w-full max-h-full" (click)="$event.stopPropagation()">
        <img
          [src]="selectedImage.url"
          [alt]="selectedImage.name"
          class="max-w-full max-h-full object-contain"
        >
        <button
          (click)="closeImageModal()"
          class="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div class="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
          {{ selectedImage.name }}
        </div>
      </div>
    </div>
  `
})
export class AttachmentDisplayComponent {
  @Input() attachments: ChatAttachment[] | undefined;

  public selectedImage: ChatAttachment | null = null;

  public openImageModal(attachment: ChatAttachment): void {
    this.selectedImage = attachment;
  }

  public closeImageModal(): void {
    this.selectedImage = null;
  }

  public downloadFile(attachment: ChatAttachment): void {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public getFileTypeDescription(mimeType: string): string {
    const typeMap: { [key: string]: string } = {
      'application/pdf': 'PDF-Dokument',
      'text/plain': 'Textdatei',
      'application/json': 'JSON-Datei',
      'text/csv': 'CSV-Datei',
      'text/markdown': 'Markdown-Datei',
      'application/msword': 'Word-Dokument',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word-Dokument'
    };

    if (mimeType.startsWith('image/')) {
      return 'Bild';
    }

    return typeMap[mimeType] || 'Datei';
  }

  public trackByAttachmentId(index: number, attachment: ChatAttachment): string {
    return attachment.id;
  }
}

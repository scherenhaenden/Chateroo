// filepath: /Users/edwardflores/Projects/Development/Chateroo/apps/backend/src/ai-engine/engine-utils.ts

/**
 * Formats a file size in bytes to a human-readable string.
 */
export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Determines if a file type is a text file based on its MIME type.
 */
export function isTextFile(type: string): boolean {
  return type.startsWith('text/');
}

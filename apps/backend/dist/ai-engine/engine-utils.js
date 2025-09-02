"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFileSize = formatFileSize;
exports.isTextFile = isTextFile;
/**
 * Formats a file size into a human-readable string.
 *
 * The function takes a size in bytes and converts it into a string representation
 * in bytes (B), kilobytes (KB), or megabytes (MB) based on the size value.
 * It checks the size against thresholds to determine the appropriate unit
 * and formats the output to two decimal places for KB and MB.
 *
 * @param {number} size - The size in bytes to be formatted.
 */
function formatFileSize(size) {
    if (size < 1024)
        return `${size} B`;
    if (size < 1024 * 1024)
        return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
/**
 * Checks if the given type is a text file.
 */
function isTextFile(type) {
    return type.startsWith('text/');
}
//# sourceMappingURL=engine-utils.js.map
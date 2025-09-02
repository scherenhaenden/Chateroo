"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFileSize = formatFileSize;
exports.isTextFile = isTextFile;
function formatFileSize(size) {
    if (size < 1024)
        return `${size} B`;
    if (size < 1024 * 1024)
        return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
function isTextFile(type) {
    return type.startsWith('text/');
}
//# sourceMappingURL=engine-utils.js.map
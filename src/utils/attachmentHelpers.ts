// utils/attachmentHelpers.ts

import { ServiceProviderAttachment } from '@/types';

/**
 * Check if a file is previewable in browser
 */
export const isPreviewable = (fileType: string): boolean => {
  const previewableTypes = ['PDF', 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG', 'BMP', 'TIFF'];
  return previewableTypes.includes(fileType.toUpperCase());
};

/**
 * Get file icon based on file type
 */
export const getFileIcon = (fileType: string): string => {
  const icons: Record<string, string> = {
    'PDF': '📄',
    'DOC': '📝',
    'DOCX': '📝',
    'XLS': '📊',
    'XLSX': '📊',
    'PPT': '📽️',
    'PPTX': '📽️',
    'JPG': '🖼️',
    'JPEG': '🖼️',
    'PNG': '🖼️',
    'GIF': '🖼️',
    'WEBP': '🖼️',
    'SVG': '🖼️',
    'BMP': '🖼️',
    'TIFF': '🖼️',
    'ZIP': '📦',
    'RAR': '📦',
    '7Z': '📦',
    'TXT': '📃',
    'CSV': '📊',
    'JSON': '📋',
    'XML': '📋',
    'HTML': '🌐',
    'MP4': '🎬',
    'MP3': '🎵',
    'WAV': '🎵',
  };
  return icons[fileType.toUpperCase()] || '📎';
};

/**
 * Get file color based on file type
 */
export const getFileColor = (fileType: string): string => {
  const colors: Record<string, string> = {
    'PDF': '#e74c3c',
    'DOC': '#2980b9',
    'DOCX': '#2980b9',
    'XLS': '#27ae60',
    'XLSX': '#27ae60',
    'PPT': '#e67e22',
    'PPTX': '#e67e22',
    'JPG': '#8e44ad',
    'JPEG': '#8e44ad',
    'PNG': '#8e44ad',
    'GIF': '#8e44ad',
    'ZIP': '#f1c40f',
    'RAR': '#f1c40f',
    'TXT': '#2c3e50',
    'MP4': '#3498db',
    'MP3': '#1abc9c',
  };
  return colors[fileType.toUpperCase()] || '#7f8c8d';
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if file is an image
 */
export const isImage = (fileType: string): boolean => {
  const imageTypes = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG', 'BMP', 'TIFF'];
  return imageTypes.includes(fileType.toUpperCase());
};

/**
 * Check if file is a PDF
 */
export const isPDF = (fileType: string): boolean => {
  return fileType.toUpperCase() === 'PDF';
};

/**
 * Check if file is a document (Word, Excel, PowerPoint)
 */
export const isDocument = (fileType: string): boolean => {
  const docTypes = ['DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'];
  return docTypes.includes(fileType.toUpperCase());
};

/**
 * Check if file is an archive
 */
export const isArchive = (fileType: string): boolean => {
  const archiveTypes = ['ZIP', 'RAR', '7Z', 'GZIP'];
  return archiveTypes.includes(fileType.toUpperCase());
};

/**
 * Get file category based on file type
 */
export const getFileCategory = (fileType: string): string => {
  if (isImage(fileType)) return 'IMAGE';
  if (isPDF(fileType)) return 'PDF';
  if (isDocument(fileType)) return 'DOCUMENT';
  if (isArchive(fileType)) return 'ARCHIVE';
  return 'OTHER';
};

/**
 * Check if attachment is expired
 */
export const isExpired = (attachment: ServiceProviderAttachment): boolean => {
  if (!attachment.expiryDate) return false;
  return new Date(attachment.expiryDate) < new Date();
};

/**
 * Get days until expiry
 */
export const getDaysUntilExpiry = (attachment: ServiceProviderAttachment): number | null => {
  if (!attachment.expiryDate) return null;
  const expiry = new Date(attachment.expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get expiry status
 */
export const getExpiryStatus = (attachment: ServiceProviderAttachment): 'EXPIRED' | 'EXPIRING_SOON' | 'VALID' | 'UNKNOWN' => {
  if (!attachment.expiryDate) return 'UNKNOWN';
  
  const daysUntilExpiry = getDaysUntilExpiry(attachment);
  if (daysUntilExpiry === null) return 'UNKNOWN';
  
  if (daysUntilExpiry < 0) return 'EXPIRED';
  if (daysUntilExpiry <= 30) return 'EXPIRING_SOON';
  return 'VALID';
};
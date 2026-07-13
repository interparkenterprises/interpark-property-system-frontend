'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Attachment } from '@/types';
import { tenantsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileIcon,
  FileImage,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  File as FileDefault,
  Eye,
  Download,
  Pencil,
  Trash2,
  Upload,
  X,
  Loader2,
  FolderOpen,
} from 'lucide-react';

interface AttachmentSectionProps {
  tenantId: string;
  isAdmin?: boolean;
  isManager?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AttachmentSection({ 
  tenantId, 
  isAdmin = false, 
  isManager = false,
  canEdit = false,
  canDelete = false 
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [editName, setEditName] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const canUpload = isAdmin || isManager || canEdit;

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tenantsAPI.getAttachments(tenantId);
      setAttachments(response.data || []);
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      toast.error(error.message || 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      e.target.value = '';
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/json',
      'application/zip',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Please upload images, PDFs, Office documents, or text files.');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      await tenantsAPI.uploadAttachment(tenantId, file);
      toast.success('File uploaded successfully!');
      fetchAttachments();
      e.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      setDownloadingId(attachment.id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to download files');
        return;
      }

      const downloadUrl = `/api/tenants/attachments/${attachment.id}/download?token=${encodeURIComponent(token)}`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
          return;
        }
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      toast.error(error.message || 'Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    try {
      setPreviewingId(attachment.id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to preview files');
        return;
      }

      const previewUrl = `/api/tenants/attachments/${attachment.id}/preview?token=${encodeURIComponent(token)}`;
      
      window.open(previewUrl, '_blank');
      toast.success('Preview opened in new tab');
    } catch (error: any) {
      console.error('Error previewing attachment:', error);
      toast.error(error.message || 'Failed to preview file');
    } finally {
      setPreviewingId(null);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!isAdmin) {
      toast.error('Only administrators can delete attachments');
      return;
    }

    if (!confirm('Are you sure you want to delete this attachment? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(attachmentId);
      await tenantsAPI.deleteAttachment(attachmentId);
      toast.success('Attachment deleted successfully');
      fetchAttachments();
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      toast.error(error.message || 'Failed to delete attachment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = (attachment: Attachment) => {
    if (!isAdmin) {
      toast.error('Only administrators can rename attachments');
      return;
    }
    setSelectedAttachment(attachment);
    setEditName(attachment.name);
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = async () => {
    if (!selectedAttachment) return;
    if (!editName.trim()) {
      toast.error('File name cannot be empty');
      return;
    }

    try {
      setRenaming(true);
      await tenantsAPI.updateAttachment(selectedAttachment.id, { name: editName.trim() });
      toast.success('Attachment renamed successfully');
      setShowRenameDialog(false);
      setSelectedAttachment(null);
      fetchAttachments();
    } catch (error: any) {
      console.error('Error renaming attachment:', error);
      toast.error(error.message || 'Failed to rename attachment');
    } finally {
      setRenaming(false);
    }
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isImage = mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    const isPdf = mimeType === 'application/pdf' || ext === 'pdf';
    const isWord = ['doc', 'docx'].includes(ext);
    const isExcel = ['xls', 'xlsx'].includes(ext);
    const isPowerPoint = ['ppt', 'pptx'].includes(ext);
    const isText = ['txt', 'csv'].includes(ext);
    const isCode = ['json', 'xml', 'html', 'css', 'js', 'ts'].includes(ext);
    const isArchive = ['zip', 'rar', '7z'].includes(ext);

    const iconProps = {
      className: "w-6 h-6 flex-shrink-0",
      strokeWidth: 1.5,
    };

    if (isImage) return <FileImage {...iconProps} className={`${iconProps.className} text-purple-600`} />;
    if (isPdf) return <FileText {...iconProps} className={`${iconProps.className} text-red-600`} />;
    if (isWord) return <FileText {...iconProps} className={`${iconProps.className} text-blue-600`} />;
    if (isExcel) return <FileSpreadsheet {...iconProps} className={`${iconProps.className} text-green-600`} />;
    if (isPowerPoint) return <FileText {...iconProps} className={`${iconProps.className} text-orange-600`} />;
    if (isText) return <FileText {...iconProps} className={`${iconProps.className} text-gray-600`} />;
    if (isCode) return <FileCode {...iconProps} className={`${iconProps.className} text-indigo-600`} />;
    if (isArchive) return <FileArchive {...iconProps} className={`${iconProps.className} text-yellow-600`} />;
    return <FileDefault {...iconProps} className={`${iconProps.className} text-gray-500`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Attachments</h2>
            <p className="text-sm text-gray-600">{attachments.length} file(s)</p>
          </div>
        </div>

        {canUpload && (
          <div className="relative w-full sm:w-auto">
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-sm text-gray-600">Loading attachments...</p>
          </div>
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileDefault className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-800">No attachments</p>
          <p className="text-sm text-gray-600 mt-1">Upload documents, images, or files related to this tenant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {attachments.map((attachment) => {
              const isImage = attachment.mimeType.startsWith('image/');
              const token = localStorage.getItem('token');
              const thumbnailUrl = isImage && token 
                ? `/api/tenants/attachments/${attachment.id}/preview?token=${encodeURIComponent(token)}`
                : null;
              
              return (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  className="p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 bg-white group flex flex-col"
                >
                  {/* File Icon or Image Thumbnail */}
                  <div className="flex items-center gap-3 mb-3">
                    {isImage && thumbnailUrl ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                        <img 
                          src={thumbnailUrl} 
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-50 to-blue-50">
                                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200">
                        {getFileIcon(attachment.mimeType, attachment.name)}
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate" title={attachment.name}>
                        {attachment.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-gray-600">{formatFileSize(attachment.size)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-600">
                          {format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Icon Only */}
                  <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(attachment)}
                      disabled={previewingId === attachment.id}
                      className="flex-1 h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      title="Preview"
                    >
                      {previewingId === attachment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span className="sr-only">Preview</span>
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(attachment)}
                      disabled={downloadingId === attachment.id}
                      className="flex-1 h-8 px-2 text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all"
                      title="Download"
                    >
                      {downloadingId === attachment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span className="sr-only">Download</span>
                    </Button>
                    
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRename(attachment)}
                          className="flex-1 h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          title="Rename"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="sr-only">Rename</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(attachment.id)}
                          disabled={deletingId === attachment.id}
                          className="flex-1 h-8 px-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          {deletingId === attachment.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Rename Attachment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter a new name for the attachment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input" className="text-gray-700 font-medium">
                File Name
              </Label>
              <Input
                id="rename-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter new file name"
                className="text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={renaming}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameConfirm();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setSelectedAttachment(null);
              }}
              disabled={renaming}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRenameConfirm} 
              disabled={renaming || !editName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {renaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
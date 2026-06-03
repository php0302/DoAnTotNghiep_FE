import React, { useState, useEffect, useRef, useCallback } from 'react';
import { commentService } from '../../services/commentService';
import { attachmentService } from '../../services/attachmentService';
import MentionInput from './MentionInput';
import CommentItem from './CommentItem';
import Spinner from '../ui/Spinner';
import { MessageCircle, Send, Image, X } from 'lucide-react';

/**
 * Hiển thị toàn bộ section comments của 1 task.
 * Hỗ trợ realtime: tự động append comment mới từ user khác qua WebSocket.
 *
 * @param {number}  taskId      - ID task
 * @param {number}  projectId   - ID project (để gọi suggestMembers)
 * @param {object}  currentUser - user đang đăng nhập
 */
const CommentList = ({ taskId, projectId, currentUser }) => {
  const [comments, setComments]         = useState([]);
  const [newComment, setNewComment]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  // ── Image state ──────────────────────────────────────────────────────────
  const [imageFile, setImageFile]       = useState(null);   // File object
  const [imagePreview, setImagePreview] = useState(null);   // blob URL
  const [uploadProgress, setUploadProgress] = useState(0);
  const imageInputRef                   = useRef(null);
  const commentsEndRef                  = useRef(null);

  // ── Fetch comments khi mở ────────────────────────────────────────────────
  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    commentService.getByTask(taskId)
      .then(({ data }) => setComments(data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId]);

  // ── Realtime: lắng nghe comment mới từ user khác ──────────────────────────
  // useProjectRealtime phát CustomEvent 'ws:comment-created' khi nhận WS message
  useEffect(() => {
    if (!taskId) return;

    const handleNewComment = (e) => {
      const { comment, taskId: eventTaskId } = e.detail ?? {};
      // Chỉ xử lý nếu comment thuộc task đang mở
      if (Number(eventTaskId) !== Number(taskId)) return;
      // Nếu là comment của chính mình → đã được optimistic update rồi, bỏ qua
      if (comment?.author?.id === currentUser?.id) return;

      setComments((prev) => {
        // Chống duplicate
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
      // Scroll xuống comment mới
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    window.addEventListener('ws:comment-created', handleNewComment);
    return () => window.removeEventListener('ws:comment-created', handleNewComment);
  }, [taskId, currentUser?.id]);

  // ── Image handlers ────────────────────────────────────────────────────────

  /** Validate + set image — dùng chung cho file picker và clipboard paste */
  const handleImageFromFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File ảnh vượt quá 10MB');
      return;
    }
    // Revoke URL cũ nếu đang có ảnh chưa gửi
    setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  /** File input onChange handler */
  const handleImagePick = useCallback((e) => {
    handleImageFromFile(e.target.files?.[0]);
    e.target.value = '';
  }, [handleImageFromFile]);

  /** Nhận ảnh paste từ MentionInput (Ctrl+V) */
  const handleImagePaste = useCallback((file) => {
    handleImageFromFile(file);
  }, [handleImageFromFile]);

  const handleRemoveImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  }, [imagePreview]);


  // ── Tạo comment mới (Optimistic UI + kèm ảnh) ────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const hasText  = newComment.trim().length > 0;
    const hasImage = !!imageFile;
    if ((!hasText && !hasImage) || submitting) return;

    const text   = newComment.trim();
    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      content: text,
      taskId,
      attachments: imagePreview
        ? [{ fileUrl: imagePreview, fileType: 'image/preview', originalName: imageFile?.name, isLocal: true }]
        : [],
      author: {
        id: currentUser?.id,
        username: currentUser?.username,
        fullName: currentUser?.fullName || currentUser?.username,
      },
      mentions: [],
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    setComments((prev) => [...prev, tempComment]);
    setNewComment('');

    // Lưu lại file trước khi clear
    const currentImageFile    = imageFile;
    const currentImagePreview = imagePreview;
    handleRemoveImage();
    setSubmitting(true);

    try {
      // 1. Tạo comment
      const { data } = await commentService.create(taskId, text || '\u200b');
      const createdComment = data?.data;

      // 2. Nếu có ảnh → upload vào comment vừa tạo
      let finalComment = createdComment;
      if (currentImageFile && createdComment?.id) {
        try {
          const uploadRes = await attachmentService.uploadToComment(
            createdComment.id,
            currentImageFile,
            setUploadProgress
          );
          finalComment = {
            ...createdComment,
            attachments: uploadRes.data?.data ? [uploadRes.data.data] : [],
          };
        } catch {
          finalComment = { ...createdComment, attachments: [] };
        } finally {
          if (currentImagePreview) URL.revokeObjectURL(currentImagePreview);
          setUploadProgress(0);
        }
      }

      setComments((prev) => prev.map((c) => (c.id === tempId ? finalComment : c)));
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setNewComment(text);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdated = (updated) => {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleted = (deletedId) => {
    setComments((prev) => prev.filter((c) => c.id !== deletedId));
  };


  return (
    <div className="space-y-4">
      {/* Header */}
      <h4 className="text-xs font-semibold text-warm-gray dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
        <MessageCircle size={14} />
        Bình luận ({comments.length})
      </h4>

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scroll-smooth">
          {comments.length === 0 && (
            <p className="text-xs text-warm-muted dark:text-gray-500 text-center py-4 italic">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </p>
          )}
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUser={currentUser}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}

      {/* ── Input form ── */}
      <form onSubmit={handleSubmit} className="space-y-1.5">

        {/* Wrapper: bao gồm preview ảnh + textarea + hint trong 1 khối */}
        <div className={`relative border rounded-xl transition-colors ${
          imagePreview
            ? 'border-indigo-300 dark:border-indigo-600 bg-warm-white dark:bg-slate-800'
            : 'border-black/10 dark:border-white/10 bg-transparent'
        }`}>

          {/* Preview ảnh đã chọn — hiển thị BÊN TRONG khối input */}
          {imagePreview && (
            <div className="px-3 pt-3 pb-1">
              <div className="relative inline-block rounded-lg overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="max-h-40 object-contain block"
                  style={{ maxWidth: '260px' }}
                />
                {/* Progress overlay khi đang upload */}
                {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5 rounded-lg">
                    <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-white text-[10px] font-semibold tracking-wide">
                      Đang upload {uploadProgress}%
                    </span>
                  </div>
                )}
                {/* Nút xóa ảnh */}
                {!submitting && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                    title="Xóa ảnh"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-warm-muted dark:text-gray-500 mt-1.5">
                {imageFile?.name} · {imageFile ? (imageFile.size / 1024).toFixed(0) : 0} KB
              </p>
            </div>
          )}

          {/* Row: Textarea + nút */}
          <div className="flex gap-2 items-end p-1.5">
            <div className="flex-1">
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                onSubmit={handleSubmit}
                projectId={projectId}
                disabled={submitting}
                onImagePaste={handleImagePaste}
              />
            </div>

            {/* Nút chọn ảnh từ máy */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={submitting}
              className={`flex-shrink-0 self-end p-2 rounded-lg border transition-colors ${
                imageFile
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                  : 'border-black/10 dark:border-white/10 text-warm-gray dark:text-gray-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
              title="Đính kèm ảnh"
            >
              <Image size={16} />
            </button>

            {/* Nút gửi */}
            <button
              type="submit"
              className="btn-primary px-3 py-2 flex-shrink-0 self-end"
              disabled={submitting || (!newComment.trim() && !imageFile)}
            >
              {submitting ? <Spinner size="sm" /> : <Send size={14} />}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImagePick}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </form>

      <p className="text-[10px] text-warm-muted dark:text-gray-500">
        Nhấn <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px]">Enter</kbd> để gửi,{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px]">Shift+Enter</kbd> để xuống dòng,{' '}
        dùng <span className="font-mono">@</span> để nhắc đến thành viên,{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-[10px]">Ctrl+V</kbd> để dán ảnh.
      </p>
    </div>
  );
};

export default CommentList;


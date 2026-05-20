import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, Star, Image as ImageIcon, Loader2, GripVertical } from 'lucide-react';
import api from '../../api';
import { compressImage } from '../../utils/compressImage';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxBytes?: number;
  disabled?: boolean;
  helperText?: string;
}

const DEFAULT_MAX_IMAGES = 10;
const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = DEFAULT_MAX_IMAGES,
  maxBytes = DEFAULT_MAX_BYTES,
  disabled = false,
  helperText,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [progress, setProgress] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (incoming: File[]) => {
      if (disabled) return;
      setError(null);

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        setError(`You can only upload up to ${maxImages} images.`);
        return;
      }

      const accepted = incoming.filter((f) => f.type.startsWith('image/'));
      if (accepted.length !== incoming.length) {
        setError('Only image files are allowed.');
      }

      const toProcess = accepted.slice(0, remaining);
      if (accepted.length > remaining) {
        setError(`Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added.`);
      }

      if (!toProcess.length) return;

      setUploadingCount(toProcess.length);
      setProgress(toProcess.map((f) => ({ name: f.name, pct: 0 })));

      const newUrls: string[] = [];
      const tooLarge: string[] = [];

      for (let i = 0; i < toProcess.length; i++) {
        const original = toProcess[i];
        try {
          let toUpload = original;
          if (original.size > maxBytes) {
            setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, pct: 10 } : p)));
            toUpload = await compressImage(original, { maxBytes });
          }
          if (toUpload.size > maxBytes) {
            tooLarge.push(original.name);
            setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, pct: 100 } : p)));
            continue;
          }
          const formData = new FormData();
          formData.append('image', toUpload, toUpload.name);
          const res = await api.post('/api/products/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              if (!e.total) return;
              const pct = Math.round((e.loaded * 100) / e.total);
              setProgress((prev) => prev.map((p, idx) => (idx === i ? { ...p, pct } : p)));
            },
          });
          if (res.data?.url) newUrls.push(res.data.url);
        } catch (err: any) {
          console.error('Upload failed', err);
          setError(err.response?.data?.message || `Failed to upload ${original.name}`);
        }
      }

      if (tooLarge.length) {
        setError(`Could not compress under ${Math.floor(maxBytes / (1024 * 1024))}MB: ${tooLarge.join(', ')}`);
      }

      if (newUrls.length) {
        onChange([...images, ...newUrls]);
      }

      setUploadingCount(0);
      setProgress([]);
      if (inputRef.current) inputRef.current.value = '';
    },
    [disabled, images, maxBytes, maxImages, onChange]
  );

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    handleFiles(Array.from(files));
  };

  const handleDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  };

  const handleReorderDrop = (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx) {
      setDragIndex(null);
      setHoverIndex(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    setDragIndex(null);
    setHoverIndex(null);
  };

  const removeAt = (idx: number) => {
    if (disabled) return;
    onChange(images.filter((_, i) => i !== idx));
  };

  const makeCover = (idx: number) => {
    if (disabled || idx === 0) return;
    const next = [...images];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    onChange(next);
  };

  const isBusy = uploadingCount > 0;
  const remainingSlots = Math.max(0, maxImages - images.length);
  const dropDisabled = disabled || remainingSlots === 0;

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          if (dropDisabled) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={dropDisabled ? undefined : handleDrop}
        className={`block border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          dropDisabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-70'
            : isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={dropDisabled || isBusy}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            {isBusy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>
          <div className="text-sm font-medium text-gray-800">
            {isBusy
              ? 'Uploading…'
              : remainingSlots === 0
                ? 'Image limit reached'
                : isDragging
                  ? 'Drop to upload'
                  : 'Drag & drop, or click to upload'}
          </div>
          <div className="text-xs text-gray-500">
            {helperText ||
              `Up to ${maxImages} images (JPEG, PNG, WebP). Files over ${Math.floor(maxBytes / (1024 * 1024))}MB are compressed automatically.`}
          </div>
          <div className="text-xs text-gray-400">{images.length} / {maxImages} added</div>
        </div>
      </label>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {progress.length > 0 && (
        <div className="space-y-2">
          {progress.map((p, i) => (
            <div key={i} className="text-xs text-gray-600">
              <div className="flex items-center justify-between mb-0.5">
                <span className="truncate pr-2">{p.name}</span>
                <span>{p.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              draggable={!disabled}
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverIndex(idx);
              }}
              onDragLeave={() => setHoverIndex((cur) => (cur === idx ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                handleReorderDrop(idx);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setHoverIndex(null);
              }}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                hoverIndex === idx && dragIndex !== null && dragIndex !== idx
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : idx === 0
                    ? 'border-amber-400'
                    : 'border-gray-200'
              } ${dragIndex === idx ? 'opacity-50' : ''}`}
            >
              <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-32 object-cover" />

              <div className="absolute top-1 left-1 flex items-center gap-1">
                {idx === 0 ? (
                  <span className="bg-amber-400 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Star className="w-3 h-3 fill-white" /> Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(idx)}
                    title="Set as cover"
                    className="bg-white/90 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    Set cover
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeAt(idx)}
                title="Remove"
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-1 left-1 bg-black/55 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                <GripVertical className="w-3 h-3" /> Drag to reorder
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !isBusy && (
        <div className="flex items-center gap-2 text-xs text-gray-400 pl-1">
          <ImageIcon className="w-3.5 h-3.5" />
          The first image becomes the cover. Drag thumbnails to reorder.
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

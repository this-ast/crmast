import { useRef, useState, useCallback } from 'react'
import { Upload, Trash2, ImagePlus, Loader2, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/utils/cn'

interface MediaUploaderProps {
  photos: string[]
  onUpload: (files: File[]) => Promise<void>
  onDelete: (url: string) => void
  uploading?: boolean
  className?: string
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: string[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx((i) => (i - 1 + photos.length) % photos.length)
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx((i) => (i + 1) % photos.length)
  }

  return (
    <div
      className="fixed inset-0 z-[10100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <img
        src={photos[idx]}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === idx ? 'bg-white' : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MediaUploader({
  photos,
  onUpload,
  onDelete,
  uploading = false,
  className,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      await onUpload(imageFiles)
    },
    [onUpload]
  )

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden group/photo bg-slate-100">
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightboxIdx(i)}
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/photo:opacity-100">
                <button
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  title="Просмотр"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(url)}
                  className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {/* Photo index badge */}
              <div className="absolute top-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-6',
          dragOver
            ? 'border-blue-400 bg-blue-50 scale-[1.01]'
            : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50'
        )}
      >
        {uploading ? (
          <>
            <Loader2 size={24} className="text-blue-500 animate-spin" />
            <p className="text-sm text-blue-600 font-medium">Загрузка...</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <ImagePlus size={20} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                {photos.length === 0 ? 'Добавить фотографии' : 'Добавить ещё'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Перетащите или нажмите · JPG, PNG, WEBP · до 10 МБ
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  )
}

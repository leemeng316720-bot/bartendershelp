import { useRef, useState } from 'react'
import { Camera, RefreshCw, Trash2, Loader2, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { fileToCompressedDataUrl } from '@/lib/image'

interface Props {
  photo?: string
  onChange: (photo: string | undefined) => void
  /** 紧凑模式（速记页用） */
  compact?: boolean
}

export default function PhotoField({ photo, onChange, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = () => inputRef.current?.click()

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('这不是图片')
      return
    }
    setBusy(true)
    try {
      const url = await fileToCompressedDataUrl(file)
      onChange(url)
    } catch {
      toast.error('照片处理失败，换一张试试')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {photo ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <img src={photo} alt="酒的形态" className="aspect-[4/3] w-full object-cover" />
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              onClick={pick}
              className="flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-[11px] text-white backdrop-blur"
            >
              <RefreshCw className="h-3 w-3" /> 换一张
            </button>
            <button
              onClick={() => onChange(undefined)}
              className="flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-[11px] text-white backdrop-blur"
            >
              <Trash2 className="h-3 w-3" /> 移除
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={pick}
          disabled={busy}
          className={
            compact
              ? 'flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-3 text-xs text-muted-foreground'
              : 'flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-muted-foreground'
          }
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : compact ? (
            <>
              <ImagePlus className="h-4 w-4" /> 顺手拍一张成品照（可选）
            </>
          ) : (
            <>
              <Camera className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-xs">拍下这杯酒的形态</span>
              <span className="text-[11px] text-muted-foreground/50">颜色、杯型、装饰，都是创作结果</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

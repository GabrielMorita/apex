"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

const OUTPUT_SIZE = 512;

async function drawCrop(canvas: HTMLCanvasElement, image: ImageBitmap, zoom: number, offsetX: number, offsetY: number) {
  const size = canvas.width;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível.");
  const baseScale = Math.max(size / image.width, size / image.height);
  const scale = baseScale * zoom;
  const width = image.width * scale;
  const height = image.height * scale;
  const maxX = Math.max(0, (width - size) / 2);
  const maxY = Math.max(0, (height - size) / 2);
  context.clearRect(0, 0, size, size);
  context.drawImage(image, (size - width) / 2 + (offsetX / 100) * maxX, (size - height) / 2 + (offsetY / 100) * maxY, width, height);
}

export default function AvatarEditor({ file, onCancel, onConfirm }: { file: File; onCancel: () => void; onConfirm: (blob: Blob) => Promise<void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void createImageBitmap(file).then((bitmap) => {
      if (active) setImage(bitmap);
      else bitmap.close();
    });
    return () => { active = false; };
  }, [file]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    void drawCrop(canvasRef.current, image, zoom, offsetX, offsetY);
  }, [image, offsetX, offsetY, zoom]);

  async function confirm() {
    if (!image) return;
    setSaving(true);
    try {
      const output = document.createElement("canvas");
      output.width = OUTPUT_SIZE;
      output.height = OUTPUT_SIZE;
      await drawCrop(output, image, zoom, offsetX, offsetY);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob((value) => value ? resolve(value) : reject(new Error("Falha ao processar a imagem.")), "image/webp", 0.84));
      await onConfirm(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Ajustar foto de perfil">
      <div className="w-full max-w-md rounded-2xl border border-apex-border bg-apex-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[14px] font-semibold text-apex-white">Ajustar foto</p><p className="mt-1 text-[10px] text-apex-faint">Centralize o rosto dentro do enquadramento.</p></div>
          <button type="button" onClick={onCancel} disabled={saving} className="flex h-9 w-9 items-center justify-center rounded-full border border-apex-border text-apex-muted hover:text-apex-white"><X size={15} /></button>
        </div>
        <div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-full border-2 border-gold/50 bg-apex-surface">
          <canvas ref={canvasRef} width={280} height={280} className="h-full w-full" />
        </div>
        <div className="mt-5 space-y-3">
          <label className="block text-[10px] text-apex-muted">Zoom<input type="range" min="1" max="2.5" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-1 w-full accent-amber-400" /></label>
          <label className="block text-[10px] text-apex-muted">Posição horizontal<input type="range" min="-100" max="100" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} className="mt-1 w-full accent-amber-400" /></label>
          <label className="block text-[10px] text-apex-muted">Posição vertical<input type="range" min="-100" max="100" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} className="mt-1 w-full accent-amber-400" /></label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-apex-border px-4 py-2.5 text-[12px] text-apex-muted disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={() => void confirm()} disabled={saving || !image} className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-[12px] font-semibold text-apex-bg disabled:opacity-50">
            {saving && <LoaderCircle size={13} className="animate-spin" />} Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}

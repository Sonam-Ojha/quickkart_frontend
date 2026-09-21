import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Loader2, X, ZoomIn } from 'lucide-react';
import { Button } from '../ui/button';
import { getCroppedImageBlob } from './cropImage';

interface Props {
  imageSrc: string;
  aspectRatio: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
}

export default function ImageCropModal({ imageSrc, aspectRatio, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setCroppedPixels(pixels), []);

  const handleConfirm = async () => {
    if (!croppedPixels) return;
    setWorking(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedPixels);
      await onConfirm(blob);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Crop Image</h3>
            <p className="text-xs text-slate-400 mt-0.5">Drag to reposition, scroll or use the slider to zoom</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <div className="relative w-full h-80 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 flex items-center gap-3">
          <ZoomIn size={16} className="text-slate-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <Button type="button" variant="outline" className="flex-1 h-10" onClick={onCancel}>Cancel</Button>
          <Button type="button" className="flex-1 h-10" onClick={handleConfirm} disabled={working || !croppedPixels}>
            {working && <Loader2 size={14} className="animate-spin" />}
            Use This Crop
          </Button>
        </div>
      </div>
    </div>
  );
}

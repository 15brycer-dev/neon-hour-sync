import React, { useRef, useState } from "react";
import { Upload, Play, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { playCustomSound, DEFAULT_CUSTOM_SOUND } from "@/lib/soundboard";

export default function CustomSoundControl({ customSound, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!/^audio\//.test(file.type) && !/\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.name)) {
      setError("That file doesn't look like an audio file.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } catch {
      setError("Upload failed — try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="h-9 px-3 rounded-lg border border-white/10 bg-surface text-xs uppercase tracking-wider text-white/70 hover:text-neon hover:border-neon/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading…" : customSound ? "Replace" : "Upload your own"}
        </button>
        {customSound && (
          <>
            <button
              type="button"
              aria-label="Preview custom sound"
              onClick={() => { playCustomSound(customSound).catch(() => {}); }}
              className="w-9 h-9 rounded-lg border border-white/10 bg-surface text-white/70 hover:text-neon hover:border-neon/50 transition-colors flex items-center justify-center"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Back to default sound"
              onClick={() => onChange(DEFAULT_CUSTOM_SOUND)}
              className="w-9 h-9 rounded-lg border border-white/10 bg-surface text-white/70 hover:text-neon hover:border-neon/50 transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      {customSound && <p className="text-[11px] text-white/40">Your sound plays on every track switch. The rewind button restores the original soda-can sound.</p>}
      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
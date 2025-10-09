// CameraOCRPage.tsx
// Mobile-friendly React page to capture a photo via camera and POST it to a backend OCR API.
// Backend endpoint expected at POST /api/ocr accepting multipart/form-data field "image".
// Works with: 1) <input capture> for maximum iOS/Android compatibility, 2) getUserMedia live preview + capture.

import React, { useEffect, useRef, useState } from "react";

export default function CameraOCRPage() {
  const [status, setStatus] = useState<string>("");
  const [ocrText, setOcrText] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [streamActive, setStreamActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  function stopStream() {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setStreamActive(false);
  }

  async function startLiveCamera() {
    setStatus("");
    setOcrText("");
    setPreviewUrl("");
    stopStream();
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      setStatus(`Camera error: ${err?.message || err}`);
    }
  }

  function captureFrame() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current!;

    // Determine output size with downscaling to ~2MP to keep uploads small.
    const maxPixels = 2_000_000; // ~2MP
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w * h > maxPixels) {
      const scale = Math.sqrt(maxPixels / (w * h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      await sendToOcr(file);
    }, "image/jpeg", 0.92);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("");
    setOcrText("");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    await sendToOcr(file);
    // Reset input so selecting the same file again still triggers change
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendToOcr(file: File) {
    setIsSending(true);
    setStatus("Uploading");
    setOcrText("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/ocr", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      // Expect JSON response like { text: string, ... }
      const data = await res.json().catch(() => ({} as any));
      setOcrText(data?.text || "");
      setStatus("Done");
    } catch (err: any) {
      setStatus(`Upload/OCR error: ${err?.message || err}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Mobile OCR Capture</h1>

      <div className="space-y-3">
        <button
          className="w-full rounded-2xl px-4 py-3 bg-black text-white disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
        >
          Open Camera (Best Mobile Compatibility)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickFile}
          className="hidden"
        />

        <button
          className="w-full rounded-2xl px-4 py-3 bg-gray-800 text-white disabled:opacity-50"
          onClick={startLiveCamera}
          disabled={isSending}
        >
          Start Live Camera
        </button>

        {streamActive && (
          <div className="rounded-2xl overflow-hidden border border-gray-200">
            <video ref={videoRef} playsInline muted className="w-full h-auto" />
            <div className="p-3 flex gap-3">
              <button
                className="flex-1 rounded-xl px-4 py-3 bg-blue-600 text-white disabled:opacity-50"
                onClick={captureFrame}
                disabled={isSending}
              >
                Capture & Send to OCR
              </button>
              <button
                className="rounded-xl px-4 py-3 bg-gray-200"
                onClick={stopStream}
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Preview</div>
            <img src={previewUrl} alt="preview" className="w-full rounded-xl border" />
          </div>
        )}

        <div className="text-sm text-gray-600">{status}</div>

        {ocrText && (
          <div className="mt-2 p-3 rounded-xl border bg-white">
            <div className="text-sm font-semibold mb-1">OCR Result</div>
            <pre className="whitespace-pre-wrap text-sm">{ocrText}</pre>
          </div>
        )}

        {/* Offscreen canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>Notes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the first button for the most reliable mobile experience (iOS Safari honors capture).</li>
            <li>Live camera requires permissions; some browsers block autoplay without user gesture.</li>
            <li>Images are downscaled to ~2MP before upload to reduce bandwidth.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


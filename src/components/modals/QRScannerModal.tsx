/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Image, X, QrCode, Clipboard, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned: (
    code: string,
    parsedDetails?: {
      name?: string;
      item?: string;
      unit?: string;
      members?: any[];
      cost?: number;
    }
  ) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanned,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'photo' | 'paste'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [pasteInput, setPasteInput] = useState('');
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [scannedSuccessCode, setScannedSuccessCode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const parseInviteString = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Check for URL containing join query params
    if (trimmed.includes('join') || trimmed.includes('?c=') || trimmed.includes('?join=')) {
      try {
        const urlStr =
          trimmed.startsWith('http') || trimmed.startsWith('panipari')
            ? trimmed.replace('panipari://join', 'https://panipari.app/join')
            : `https://panipari.app/${trimmed}`;
        const url = new URL(urlStr);
        const code = url.searchParams.get('c') || url.searchParams.get('code') || url.searchParams.get('join');
        const encodedData = url.searchParams.get('d') || url.searchParams.get('data');

        let details: any = {};
        if (encodedData) {
          try {
            const decodedJson = decodeURIComponent(escape(atob(encodedData)));
            details = JSON.parse(decodedJson);
          } catch {
            // Ignore base64 decode failures
          }
        }

        if (code || details.c) {
          return {
            code: (code || details.c).toUpperCase(),
            name: details.n || url.searchParams.get('n') || url.searchParams.get('name') || undefined,
            item: details.i || url.searchParams.get('i') || url.searchParams.get('item') || undefined,
            unit: details.u || url.searchParams.get('u') || undefined,
            members: details.m || undefined,
            cost: details.cost || undefined,
          };
        }
      } catch {
        // Fall through
      }
    }

    // Direct JSON string check
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.c || parsed.code) {
          return {
            code: (parsed.c || parsed.code).toUpperCase(),
            name: parsed.n || parsed.name,
            item: parsed.i || parsed.item,
            unit: parsed.u || parsed.unit,
            members: parsed.m || parsed.members,
            cost: parsed.cost,
          };
        }
      } catch {
        // Fall through
      }
    }

    // Match 6-character room code pattern (e.g. PP402A or DEMO42)
    const match = trimmed.match(/\b([A-HJ-NP-Z0-9]{5,8})\b/i);
    if (match) {
      return { code: match[1].toUpperCase() };
    }

    // Direct code
    if (trimmed.length >= 4 && trimmed.length <= 10 && /^[a-zA-Z0-9]+$/.test(trimmed)) {
      return { code: trimmed.toUpperCase() };
    }

    return null;
  }, []);

  const handleSuccessfulScan = useCallback(
    (code: string, parsedDetails?: any) => {
      setScannedSuccessCode(code);
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([80, 50, 100]);
        }
      } catch {
        // Ignore vibration errors
      }

      setTimeout(() => {
        onScanned(code, parsedDetails);
        onClose();
      }, 500);
    },
    [onScanned, onClose]
  );

  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermissionGranted(false);
      setError('Camera access is not supported by your browser. Please upload a QR screenshot or paste the code.');
      setActiveTab('photo');
      return;
    }

    try {
      // Request rear/environment camera with standard mobile constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanVideoFrame();
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      setCameraPermissionGranted(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied by your phone. You can permit camera in site settings, choose a photo from gallery, or paste the code.');
      } else {
        setError(`Could not start camera: ${err.message || 'Device in use or unavailable'}. Please use photo upload instead.`);
      }
    }
  }, [stopCamera]);

  const scanVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      const parsed = parseInviteString(code.data);
      if (parsed && parsed.code) {
        stopCamera();
        handleSuccessfulScan(parsed.code, parsed);
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setScanningPhoto(true);

    try {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setError('Canvas unavailable for scanning.');
            setScanningPhoto(false);
            return;
          }

          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          URL.revokeObjectURL(objectUrl);

          if (qrResult && qrResult.data) {
            const parsed = parseInviteString(qrResult.data);
            if (parsed && parsed.code) {
              handleSuccessfulScan(parsed.code, parsed);
            } else {
              setError(`QR Code detected, but could not find room code: "${qrResult.data}"`);
            }
          } else {
            setError('No QR code detected in this photo. Please make sure the QR is clear and well-lit.');
          }
        } catch (err: any) {
          setError(`Scan error: ${err.message}`);
        } finally {
          setScanningPhoto(false);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError('Could not open image file.');
        setScanningPhoto(false);
      };

      img.src = objectUrl;
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setScanningPhoto(false);
    }
  };

  const handlePasteSubmit = () => {
    const parsed = parseInviteString(pasteInput);
    if (parsed && parsed.code) {
      handleSuccessfulScan(parsed.code, parsed);
    } else {
      setError('Could not find a valid room code. Please check and try again.');
    }
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteInput(text);
        const parsed = parseInviteString(text);
        if (parsed && parsed.code) {
          handleSuccessfulScan(parsed.code, parsed);
        }
      }
    } catch {
      setError('Clipboard access denied. Please paste directly into the text box.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl text-slate-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Join Room via QR</h3>
            <p className="text-[11px] text-slate-400">Scan camera, choose photo, or enter code</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 mb-3.5 border border-slate-800">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'camera'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'photo'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Photo</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'paste'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste Code</span>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="flex-1 leading-snug">{error}</span>
          </div>
        )}

        {scannedSuccessCode && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">QR Scanned! Joining Flat {scannedSuccessCode}...</span>
          </div>
        )}

        {/* TAB 1: Real-time Live Camera Viewfinder */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/50 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-52 border-2 border-dashed border-cyan-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  {/* Glowing Laser Scan Bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_8px_#38bdf8]" />
                  {/* Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
                </div>
              </div>

              {cameraPermissionGranted === false && (
                <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center gap-2">
                  <Camera className="w-8 h-8 text-rose-400 mb-1" />
                  <p className="text-xs font-bold text-white">Camera Access Required</p>
                  <p className="text-[11px] text-slate-400">
                    Allow camera access when prompted by your phone or switch to the Photo tab.
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-slate-400">
              Point your phone camera at your roommate&apos;s QR code or fridge poster
            </p>
          </div>
        )}

        {/* TAB 2: Photo / Screenshot Upload */}
        {activeTab === 'photo' && (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl border-2 border-dashed border-cyan-500/40 bg-slate-950/60 hover:bg-slate-950 hover:border-cyan-400 cursor-pointer transition text-center group">
              <div className="w-12 h-12 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
                <Image className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-cyan-300 block">
                  {scanningPhoto ? 'Decoding QR Photo...' : 'Choose QR Screenshot or Photo'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Upload screenshot sent via WhatsApp or camera photo
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={scanningPhoto}
              />
            </label>
            <p className="text-center text-[10px] text-slate-500">
              Powered by pure on-device QR decoder. No data leaves your phone.
            </p>
          </div>
        )}

        {/* TAB 3: Paste Code or Message */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder="Paste Room Code or WhatsApp invite"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleClipboardPaste}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700 transition"
                  title="Paste from Clipboard"
                >
                  <Clipboard className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pasteInput.trim()}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50"
              >
                Join Flat with Code
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Works with 6-character room codes (e.g. PP402A) or complete invite links.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

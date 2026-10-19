/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, MessageSquare, Share2, Printer, X } from 'lucide-react';
import { downloadQRPoster, downloadRawQR } from '../../utils/qrPoster';

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomName: string;
  itemName: string;
  customDataUrl?: string; // Optional custom payload (e.g. for UPI)
  customTitle?: string;
}

export const QRShareModal: React.FC<QRShareModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomName,
  itemName,
  customDataUrl,
  customTitle,
}) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);

  const joinUrl = customDataUrl || (typeof window !== 'undefined' ? `${window.location.origin}?join=${roomCode}` : '');

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0369a1',
        light: '#ffffff',
      },
    })
      .then((url) => setQrSrc(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, joinUrl]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName} on PaniPari`,
          text: `Join our flat on PaniPari to track ${itemName} turns! Room Code: ${roomCode}`,
          url: joinUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      copyCode();
    }
  };

  const shareOnWhatsApp = () => {
    const text = `💧 *Join our flat on PaniPari!*\n` +
      `🏠 Flat: *${roomName}*\n` +
      `📦 Tracking: *${itemName}* turns fairly\n\n` +
      `🔑 *Room Code:* *${roomCode}*\n` +
      `👉 *Direct Join Link:* ${joinUrl}\n\n` +
      `Scan the QR code or tap the link to join!`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadPoster = async () => {
    setDownloadingPoster(true);
    try {
      await downloadQRPoster({
        roomCode,
        roomName,
        itemName,
        joinUrl,
      });
    } catch (e) {
      console.error('Failed to download QR poster', e);
    } finally {
      setDownloadingPoster(false);
    }
  };

  const handleDownloadRawQR = async () => {
    try {
      await downloadRawQR(joinUrl, `PaniPari-${roomCode}-QR`);
    } catch (e) {
      console.error('Failed to download raw QR', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="inline-block p-2 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
            <Share2 className="w-5 h-5" />
          </span>
          <h3 className="text-xl font-bold text-white">
            {customTitle || 'Invite Flatmates'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan with phone camera or use the 6-character room code
          </p>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="mt-4 flex justify-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl inline-block border-4 border-cyan-400/30">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="Room QR Code"
                className="w-48 h-48 rounded-xl object-contain"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            )}
          </div>
        </div>

        {/* 6-Character Room Code Display */}
        <div className="mt-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Room Code
            </div>
            <div className="text-2xl font-black tracking-widest text-cyan-300 font-mono">
              {roomCode}
            </div>
          </div>
          <button
            onClick={copyCode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Sharing Options: WhatsApp & System Share */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={shareOnWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={shareInvite}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Link</span>
          </button>
        </div>

        {/* Poster & Printable Download */}
        <div className="mt-2.5 pt-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={handleDownloadPoster}
            disabled={downloadingPoster}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>{downloadingPoster ? 'Generating Poster...' : 'Download Fridge / Door Poster (PNG)'}</span>
          </button>

          <button
            onClick={handleDownloadRawQR}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Raw QR Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};


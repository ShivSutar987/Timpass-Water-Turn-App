/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import QRCode from 'qrcode';

interface PosterOptions {
  roomCode: string;
  roomName: string;
  itemName: string;
  joinUrl: string;
}

/**
 * Generates a high-resolution printable / sharable poster card with the Room QR code,
 * flat details, and instructions, then triggers an automatic browser download.
 */
export async function downloadQRPoster({
  roomCode,
  roomName,
  itemName,
  joinUrl,
}: PosterOptions): Promise<void> {
  // Generate high-res QR code image data URL
  const qrDataUrl = await QRCode.toDataURL(joinUrl, {
    width: 360,
    margin: 2,
    color: {
      dark: '#0369a1',
      light: '#ffffff',
    },
  });

  return new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = 640;
        const height = 860;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // 1. Sleek Gradient Dark Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#031726');
        bgGrad.addColorStop(0.5, '#07162c');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Card Border
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.strokeRect(16, 16, width - 32, height - 32);

        // Inner glowing border
        ctx.strokeStyle = '#0ea5e933';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 24, width - 48, height - 48);

        // 2. Top Header Brand
        ctx.textAlign = 'center';
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText('💧 PaniPari', width / 2, 75);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 14px sans-serif';
        ctx.fillText('FAIR TURN & COST TRACKER', width / 2, 102);

        // 3. Flat Name & Item
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        // Truncate long room names
        const displayRoom = roomName.length > 28 ? roomName.substring(0, 26) + '...' : roomName;
        ctx.fillText(displayRoom, width / 2, 155);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '500 16px sans-serif';
        ctx.fillText(`Tracking: ${itemName}`, width / 2, 185);

        // 4. White Card for QR Code
        const qrBoxSize = 380;
        const qrBoxX = (width - qrBoxSize) / 2;
        const qrBoxY = 210;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // Rounded rectangle for QR frame
        const r = 24;
        ctx.moveTo(qrBoxX + r, qrBoxY);
        ctx.arcTo(qrBoxX + qrBoxSize, qrBoxY, qrBoxX + qrBoxSize, qrBoxY + qrBoxSize, r);
        ctx.arcTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize, qrBoxX, qrBoxY + qrBoxSize, r);
        ctx.arcTo(qrBoxX, qrBoxY + qrBoxSize, qrBoxX, qrBoxY, r);
        ctx.arcTo(qrBoxX, qrBoxY, qrBoxX + qrBoxSize, qrBoxY, r);
        ctx.closePath();
        ctx.fill();

        // Draw the QR Code image inside
        const imgPadding = 20;
        ctx.drawImage(
          qrImg,
          qrBoxX + imgPadding,
          qrBoxY + imgPadding,
          qrBoxSize - imgPadding * 2,
          qrBoxSize - imgPadding * 2
        );

        // 5. Room Code Badge Box
        const badgeY = 620;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect((width - 340) / 2, badgeY, 340, 72);

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect((width - 340) / 2, badgeY, 340, 72);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('ROOM CODE', width / 2, badgeY + 22);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(roomCode, width / 2, badgeY + 58);

        // 6. Footer Instructions
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 15px sans-serif';
        ctx.fillText('Point your phone camera at the QR code to join', width / 2, 730);

        ctx.fillStyle = '#64748b';
        ctx.font = '400 13px sans-serif';
        ctx.fillText('Tape this on the fridge, water dispenser, or room door!', width / 2, 760);

        ctx.fillStyle = '#0ea5e9';
        ctx.font = '500 12px monospace';
        const displayHost = window.location.host || 'panipari.app';
        ctx.fillText(displayHost, width / 2, 805);

        // Convert canvas to download
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate image blob'));
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `PaniPari-${roomCode}-Poster.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          resolve();
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };
    qrImg.onerror = (e) => reject(e);
    qrImg.src = qrDataUrl;
  });
}

/**
 * Downloads just the clean raw QR code PNG.
 */
export async function downloadRawQR(payload: string, filename: string): Promise<void> {
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 512,
    margin: 2,
    color: {
      dark: '#0369a1',
      light: '#ffffff',
    },
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

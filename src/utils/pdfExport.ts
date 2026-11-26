import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export interface GeneratedPdfResult {
  filename: string;
  pngFilename: string;
  pdfBlob: Blob;
  pdfBlobUrl: string;
  pdfBase64: string;
  pdfFile: File;
  pngBlob: Blob | null;
  pngBlobUrl: string | null;
  pngFile: File | null;
  canWebShareFile: boolean;
  deliveredVia: 'capacitor' | 'download' | 'ready';
  nativeUri?: string;
}

export const isMobileOrTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) return true;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    window.innerWidth < 1024
  );
};

export const cleanupGeneratedPdf = (result: GeneratedPdfResult | null) => {
  if (!result) return;
  try {
    if (result.pdfBlobUrl) URL.revokeObjectURL(result.pdfBlobUrl);
    if (result.pngBlobUrl) URL.revokeObjectURL(result.pngBlobUrl);
  } catch {
    // ignore cleanup errors
  }
};

const waitFrames = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const waitForFontsSafe = async () => {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(resolve, 700)),
    ]);
  } catch {
    // ignore font loading timeout
  }
};

const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    } catch {
      resolve(null);
    }
  });

export const triggerAnchorDownload = (url: string, filename: string): boolean => {
  if (typeof document === 'undefined') return false;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1000);
    return true;
  } catch {
    return false;
  }
};

export const canSharePdfFile = (file: File): boolean => {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};

export const shareGeneratedPdf = async (
  result: GeneratedPdfResult,
  title: string
): Promise<'shared' | 'cancelled' | 'unsupported'> => {
  // 1. Native Capacitor Share using cached native URI
  if (Capacitor.isNativePlatform()) {
    try {
      let fileUri = result.nativeUri;
      if (!fileUri && result.pdfBase64) {
        const saved = await Filesystem.writeFile({
          path: result.filename,
          data: result.pdfBase64,
          directory: Directory.Cache,
        });
        fileUri = saved.uri;
      }
      if (fileUri) {
        await Share.share({
          title,
          text: title,
          url: fileUri,
          dialogTitle: title,
        });
        return 'shared';
      }
    } catch (err: any) {
      const msg = String(err?.message || err || '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('abort')) {
        return 'cancelled';
      }
      // Fall through to Web Share if native Share isn't implemented
    }
  }

  // 2. Web Share API Level 2 (iOS Safari, Android Chrome, mobile browsers)
  if (canSharePdfFile(result.pdfFile)) {
    try {
      await navigator.share({
        title,
        files: [result.pdfFile],
      });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  return 'unsupported';
};

export const shareOrDownloadPng = async (
  result: GeneratedPdfResult,
  title: string
): Promise<'shared' | 'downloaded' | 'unsupported'> => {
  if (!result.pngBlobUrl || !result.pngFile) return 'unsupported';

  if (Capacitor.isNativePlatform() && result.pngBlob) {
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const val = String(reader.result || '');
          resolve(val.split(',')[1] || '');
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(result.pngBlob!);
      });
      if (base64) {
        const saved = await Filesystem.writeFile({
          path: result.pngFilename,
          data: base64,
          directory: Directory.Cache,
        });
        await Share.share({
          title,
          url: saved.uri,
          dialogTitle: title,
        });
        return 'shared';
      }
    } catch {
      // fall through
    }
  }

  if (canSharePdfFile(result.pngFile) && isMobileOrTablet()) {
    try {
      await navigator.share({
        title,
        files: [result.pngFile],
      });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'shared';
    }
  }

  triggerAnchorDownload(result.pngBlobUrl, result.pngFilename);
  return 'downloaded';
};

/**
 * Captures a printable DOM element inside an offscreen A4-proportioned clone
 * so wide tables are never clipped on narrow mobile viewports, builds a clean
 * multi-page A4 PDF via jsPDF, and delivers it reliably on both Mobile & Desktop.
 */
export const exportElementToPdf = async (options: {
  element: HTMLElement;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  title?: string;
}): Promise<GeneratedPdfResult> => {
  const { element, filename, orientation = 'portrait', title = filename } = options;
  const mobile = isMobileOrTablet();
  const targetWidth = orientation === 'landscape' ? 1120 : 820;

  // Build clean offscreen clone so mobile overflow-x-auto never clips tables
  const wrapper = document.createElement('div');
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${targetWidth}px`;
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.color = '#1a0e08';
  wrapper.style.zIndex = '-1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '1';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${targetWidth}px`;
  clone.style.maxWidth = 'none';
  clone.style.margin = '0';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#1a0e08';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.transition = 'none';
  clone.style.overflow = 'visible';

  // Expand any horizontally scrollable wrappers inside the clone
  const scrollables = clone.querySelectorAll<HTMLElement>(
    '.overflow-x-auto, .overflow-y-auto, .overflow-hidden'
  );
  scrollables.forEach((node) => {
    node.style.overflow = 'visible';
    node.style.maxWidth = 'none';
  });

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  let canvas: HTMLCanvasElement;
  try {
    await waitForFontsSafe();
    await waitFrames();

    const width = Math.max(clone.scrollWidth, targetWidth);
    const height = Math.max(clone.scrollHeight, 100);

    // Prevent mobile GPU canvas memory crash on tall multi-page documents
    const maxEdge = 4096;
    const maxArea = mobile ? 11_000_000 : 24_000_000;
    const desiredScale = mobile ? 1.65 : 2;
    const safeScale = Math.max(
      1,
      Math.min(
        desiredScale,
        maxEdge / width,
        maxEdge / height,
        Math.sqrt(maxArea / (width * height))
      )
    );

    const captureOpts = {
      scale: safeScale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
    };

    try {
      canvas = await html2canvas(clone, captureOpts);
    } catch {
      // Retry without CORS in case external assets reject CORS headers on mobile WebView
      canvas = await html2canvas(clone, { ...captureOpts, useCORS: false });
    }
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }

  // Use crisp JPEG compression so PDF size stays lightweight (~200-500KB) for fast mobile sharing
  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.94);

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(jpegDataUrl);
  const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  if (imgHeight <= pdfHeight + 0.5) {
    pdf.addImage(jpegDataUrl, 'JPEG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
  } else {
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(jpegDataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(jpegDataUrl, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }
  }

  const pdfBlob = pdf.output('blob');
  const pdfBlobUrl = URL.createObjectURL(pdfBlob);
  const dataUri = pdf.output('datauristring');
  const pdfBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : '';
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  const pngFilename = filename.replace(/\.pdf$/i, '.png');
  const pngBlob = await canvasToPngBlob(canvas);
  const pngBlobUrl = pngBlob ? URL.createObjectURL(pngBlob) : null;
  const pngFile = pngBlob ? new File([pngBlob], pngFilename, { type: 'image/png' }) : null;
  const canWebShareFile = canSharePdfFile(pdfFile);

  let deliveredVia: GeneratedPdfResult['deliveredVia'] = 'ready';
  let nativeUri: string | undefined;

  // Native Capacitor flow: write to cache/documents & invoke native Share/Save sheet
  if (Capacitor.isNativePlatform()) {
    try {
      // Also attempt saving a copy to Documents so Android users can find it in Files
      try {
        await Filesystem.writeFile({
          path: filename,
          data: pdfBase64,
          directory: Directory.Documents,
        });
      } catch {
        // Ignore if scoped storage denies Documents without permission; Cache always works
      }

      const cached = await Filesystem.writeFile({
        path: filename,
        data: pdfBase64,
        directory: Directory.Cache,
      });
      nativeUri = cached.uri;

      await Share.share({
        title,
        text: title,
        url: cached.uri,
        dialogTitle: title,
      });
      deliveredVia = 'capacitor';
    } catch (err) {
      console.warn('Capacitor native PDF export fallback:', err);
    }
  }

  // Standard Web / Mobile Browser download attempt
  if (deliveredVia !== 'capacitor') {
    const triggered = triggerAnchorDownload(pdfBlobUrl, filename);
    if (triggered && !mobile) {
      deliveredVia = 'download';
    }
  }

  return {
    filename,
    pngFilename,
    pdfBlob,
    pdfBlobUrl,
    pdfBase64,
    pdfFile,
    pngBlob,
    pngBlobUrl,
    pngFile,
    canWebShareFile,
    deliveredVia,
    nativeUri,
  };
};

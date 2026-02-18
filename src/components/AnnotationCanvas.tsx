import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { computeFitZoom } from '../lib/geometry';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface AnnotationCanvasProps {
  image: HTMLImageElement;
}

export default function AnnotationCanvas({ image }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { zoomIn, zoomOut, resetView } = useCanvasInteraction(canvasRef);
  useKeyboardShortcuts({ zoomIn, zoomOut, resetView });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { zoom, panX, panY } = useAppStore.getState();
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panX, dpr * panY);
    ctx.drawImage(image, 0, 0);
  }, [image]);

  const fitImageToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    const fitZoom = computeFitZoom(containerWidth, containerHeight, image.naturalWidth, image.naturalHeight);

    const panX = (containerWidth - image.naturalWidth * fitZoom) / 2;
    const panY = (containerHeight - image.naturalHeight * fitZoom) / 2;

    useAppStore.getState().setViewport(fitZoom, panX, panY);
  }, [image]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    fitImageToCanvas();
    // Draw after viewport is set (next microtask so state has flushed)
    requestAnimationFrame(draw);

    const observer = new ResizeObserver(() => {
      fitImageToCanvas();
      requestAnimationFrame(draw);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [fitImageToCanvas, draw]);

  // Redraw when store viewport changes (for future zoom/pan from toolbar)
  useEffect(() => {
    let prevZoom = useAppStore.getState().zoom;
    let prevPanX = useAppStore.getState().panX;
    let prevPanY = useAppStore.getState().panY;

    const unsub = useAppStore.subscribe((state) => {
      if (state.zoom !== prevZoom || state.panX !== prevPanX || state.panY !== prevPanY) {
        prevZoom = state.zoom;
        prevPanX = state.panX;
        prevPanY = state.panY;
        requestAnimationFrame(draw);
      }
    });
    return unsub;
  }, [draw]);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-100">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

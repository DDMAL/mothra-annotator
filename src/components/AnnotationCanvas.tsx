import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { computeFitZoom } from '../lib/geometry';
import { CLASSES, HANDLE_HALFSIZE_PX } from '../lib/constants';
import { useCanvasInteraction, type DrawingState } from '../hooks/useCanvasInteraction';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { DragState } from '../lib/types';

interface AnnotationCanvasProps {
  image: HTMLImageElement;
  isHelpOpen: boolean;
  onToggleHelp: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getClassColor(classId: number): string {
  return CLASSES.find((c) => c.id === classId)?.color ?? '#888888';
}

function getClassName(classId: number): string {
  return CLASSES.find((c) => c.id === classId)?.name ?? 'unknown';
}


export default function AnnotationCanvas({
  image,
  isHelpOpen,
  onToggleHelp,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  // Getter function refs — populated after useCanvasInteraction initializes
  const getDrawingStateRef = useRef<() => DrawingState>(() => ({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  }));
  const getDragStateRef = useRef<() => DragState>(() => ({
    active: false,
    annotationId: null,
    handle: 'body',
    previewBbox: null,
  }));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { zoom, panX, panY, annotations, boxOpacity, showLabels, hiddenClassIds, selectedId, activeClassId, editMode } =
      useAppStore.getState();
    const dpr = window.devicePixelRatio || 1;

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply viewport transform
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * panX, dpr * panY);

    // Draw image
    ctx.drawImage(image, 0, 0);

    const dragS = getDragStateRef.current();

    // Draw annotations (skip hidden classes)
    for (const ann of annotations) {
      if (hiddenClassIds.has(ann.classId)) continue;

      let [x, y, w, h] = ann.bbox;

      // Apply drag/resize preview for the annotation being manipulated
      if (dragS.active && ann.id === dragS.annotationId && dragS.previewBbox) {
        [x, y, w, h] = dragS.previewBbox;
      }

      const color = getClassColor(ann.classId);
      const isSelected = ann.id === selectedId;

      // Fill
      ctx.fillStyle = hexToRgba(color, boxOpacity);
      ctx.fillRect(x, y, w, h);

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = (isSelected ? 3 : 2) / zoom;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);

      // Selected highlight: dashed white inner stroke
      if (isSelected) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      }

      // Resize handles on selected annotation in select mode
      if (isSelected && editMode === 'select') {
        // Draw handles in screen space for consistent pixel size
        const handlePositions: [number, number][] = [
          [x, y],           [x + w, y],
          [x, y + h],       [x + w, y + h],
          [x + w / 2, y],   [x + w / 2, y + h],
          [x, y + h / 2],   [x + w, y + h / 2],
        ];

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const hs = HANDLE_HALFSIZE_PX * Math.max(1, zoom);
        for (const [hx, hy] of handlePositions) {
          const sx = hx * zoom + panX;
          const sy = hy * zoom + panY;
          ctx.fillStyle = 'white';
          ctx.fillRect(sx - hs, sy - hs, hs * 2, hs * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx - hs, sy - hs, hs * 2, hs * 2);
        }

        ctx.restore();
      }

      // Label
      if (showLabels) {
        const name = getClassName(ann.classId);
        const fontSize = Math.max(12, 14 / zoom);
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(name);
        const padding = 3 / zoom;
        const pillW = textMetrics.width + padding * 2;
        const pillH = fontSize + padding * 2;

        // Background pill
        ctx.fillStyle = color;
        ctx.fillRect(x, y - pillH, pillW, pillH);

        // Text
        ctx.fillStyle = 'white';
        ctx.textBaseline = 'top';
        ctx.fillText(name, x + padding, y - pillH + padding);
      }
    }

    // Draw preview rect if currently drawing
    const ds = getDrawingStateRef.current();
    if (ds.isDrawing) {
      const previewX = Math.min(ds.startX, ds.currentX);
      const previewY = Math.min(ds.startY, ds.currentY);
      const previewW = Math.abs(ds.currentX - ds.startX);
      const previewH = Math.abs(ds.currentY - ds.startY);

      const activeColor = getClassColor(activeClassId);

      ctx.fillStyle = hexToRgba(activeColor, 0.15);
      ctx.fillRect(previewX, previewY, previewW, previewH);

      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(previewX, previewY, previewW, previewH);
      ctx.setLineDash([]);
    }
  }, [image]);

  const requestRedraw = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(draw);
  }, [draw]);

  const { getDrawingState, getDragState, cancelDrawing, cancelDrag } = useCanvasInteraction(canvasRef, requestRedraw);
  useEffect(() => {
    getDrawingStateRef.current = getDrawingState;
    getDragStateRef.current = getDragState;
  }, [getDrawingState, getDragState]);
  useKeyboardShortcuts({ cancelDrawing, cancelDrag, isHelpOpen, toggleHelp: onToggleHelp });

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

    useAppStore.getState().setCanvasSize(containerWidth, containerHeight);

    const fitZoom = computeFitZoom(
      containerWidth,
      containerHeight,
      image.naturalWidth,
      image.naturalHeight,
    );

    const panX = (containerWidth - image.naturalWidth * fitZoom) / 2;
    const panY = (containerHeight - image.naturalHeight * fitZoom) / 2;

    useAppStore.getState().setViewport(fitZoom, panX, panY);
  }, [image]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    fitImageToCanvas();
    requestAnimationFrame(draw);

    const observer = new ResizeObserver(() => {
      fitImageToCanvas();
      requestAnimationFrame(draw);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [fitImageToCanvas, draw]);

  // Redraw when store state changes
  useEffect(() => {
    const unsub = useAppStore.subscribe((state, prevState) => {
      if (
        state.zoom !== prevState.zoom ||
        state.panX !== prevState.panX ||
        state.panY !== prevState.panY ||
        state.annotations !== prevState.annotations ||
        state.selectedId !== prevState.selectedId ||
        state.boxOpacity !== prevState.boxOpacity ||
        state.showLabels !== prevState.showLabels ||
        state.activeClassId !== prevState.activeClassId ||
        state.hiddenClassIds !== prevState.hiddenClassIds ||
        state.editMode !== prevState.editMode
      ) {
        requestRedraw();
      }
    });
    return unsub;
  }, [requestRedraw]);

  // Update cursor when editMode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { editMode } = useAppStore.getState();
    canvas.style.cursor = editMode === 'draw' ? 'crosshair' : 'default';
  });

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-100">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

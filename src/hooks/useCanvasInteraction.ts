import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { useAppStore } from '../store/useAppStore';
import { screenToImage, clamp, computeFitZoom, pointInRect } from '../lib/geometry';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, MIN_BOX_SIZE } from '../lib/constants';

export interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function useCanvasInteraction(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  requestRedraw: () => void,
) {
  const spaceHeld = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const cursorRafPending = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  const drawingState = useRef<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const getDrawingState = useCallback((): DrawingState => drawingState.current, []);

  const cancelDrawing = useCallback(() => {
    if (drawingState.current.isDrawing) {
      drawingState.current.isDrawing = false;
      requestRedraw();
    }
  }, [requestRedraw]);

  // Apply zoom toward a given screen-space point
  const applyZoom = useCallback((newZoom: number, screenX: number, screenY: number) => {
    const { zoom: oldZoom, panX, panY, imageWidth, imageHeight } = useAppStore.getState();

    const canvas = canvasRef.current;
    const minZoom = canvas && imageWidth && imageHeight
      ? computeFitZoom(canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1), imageWidth, imageHeight)
      : MIN_ZOOM;

    const clamped = clamp(newZoom, minZoom, MAX_ZOOM);
    if (clamped === oldZoom) return;
    const newPanX = screenX - (screenX - panX) * (clamped / oldZoom);
    const newPanY = screenY - (screenY - panY) * (clamped / oldZoom);
    useAppStore.getState().setViewport(clamped, newPanX, newPanY);
  }, [canvasRef]);

  // Canvas center in CSS pixels (for keyboard-driven zoom)
  const canvasCenter = useCallback((): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const dpr = window.devicePixelRatio || 1;
    return [canvas.width / dpr / 2, canvas.height / dpr / 2];
  }, [canvasRef]);

  const zoomIn = useCallback(() => {
    const { zoom } = useAppStore.getState();
    const [cx, cy] = canvasCenter();
    applyZoom(zoom + ZOOM_STEP, cx, cy);
  }, [applyZoom, canvasCenter]);

  const zoomOut = useCallback(() => {
    const { zoom } = useAppStore.getState();
    const [cx, cy] = canvasCenter();
    applyZoom(zoom - ZOOM_STEP, cx, cy);
  }, [applyZoom, canvasCenter]);

  const resetView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { imageWidth, imageHeight } = useAppStore.getState();
    if (!imageWidth || !imageHeight) return;
    const dpr = window.devicePixelRatio || 1;
    const containerWidth = canvas.width / dpr;
    const containerHeight = canvas.height / dpr;
    const fitZoom = computeFitZoom(containerWidth, containerHeight, imageWidth, imageHeight);
    const panX = (containerWidth - imageWidth * fitZoom) / 2;
    const panY = (containerHeight - imageHeight * fitZoom) / 2;
    useAppStore.getState().setViewport(fitZoom, panX, panY);
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Ctrl+Wheel zoom ---
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { zoom } = useAppStore.getState();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      applyZoom(zoom + delta, e.offsetX, e.offsetY);
    };

    // --- Pointer down: pan, select, or start drawing ---
    const onPointerDown = (e: PointerEvent) => {
      // Middle-click or Space+left-click → pan
      const isMiddle = e.button === 1;
      const isSpaceLeft = e.button === 0 && spaceHeld.current;
      if (isMiddle || isSpaceLeft) {
        e.preventDefault();
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        const { panX, panY } = useAppStore.getState();
        panOrigin.current = { x: panX, y: panY };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        return;
      }

      // Left-click (no modifier) → select or start drawing
      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
        const { zoom, panX, panY, annotations } = useAppStore.getState();
        const [ix, iy] = screenToImage(e.offsetX, e.offsetY, zoom, panX, panY);

        // Check for hit on existing annotation (reverse order = topmost first)
        for (let i = annotations.length - 1; i >= 0; i--) {
          if (pointInRect(ix, iy, annotations[i].bbox)) {
            useAppStore.getState().setSelected(annotations[i].id);
            return;
          }
        }

        // No hit → deselect and start drawing
        useAppStore.getState().setSelected(null);
        drawingState.current = {
          isDrawing: true,
          startX: ix,
          startY: iy,
          currentX: ix,
          currentY: iy,
        };
        canvas.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // Cursor coord tracking — throttled via rAF pending-flag pattern
      lastPointerPos.current = { x: e.offsetX, y: e.offsetY };
      if (!cursorRafPending.current) {
        cursorRafPending.current = true;
        requestAnimationFrame(() => {
          if (lastPointerPos.current) {
            const { x, y } = lastPointerPos.current;
            const { zoom, panX, panY } = useAppStore.getState();
            const [ix, iy] = screenToImage(x, y, zoom, panX, panY);
            useAppStore.getState().setCursorCoords([Math.round(ix), Math.round(iy)]);
          }
          cursorRafPending.current = false;
        });
      }

      // Drawing preview
      if (drawingState.current.isDrawing) {
        const { zoom, panX, panY } = useAppStore.getState();
        const [ix, iy] = screenToImage(e.offsetX, e.offsetY, zoom, panX, panY);
        drawingState.current.currentX = ix;
        drawingState.current.currentY = iy;
        requestRedraw();
        return;
      }

      // Pan delta
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const { zoom } = useAppStore.getState();
      useAppStore.getState().setViewport(
        zoom,
        panOrigin.current.x + dx,
        panOrigin.current.y + dy,
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      // End pan
      if (isPanning.current) {
        isPanning.current = false;
        canvas.releasePointerCapture(e.pointerId);
        canvas.style.cursor = spaceHeld.current ? 'grab' : 'crosshair';
        return;
      }

      // End drawing
      if (drawingState.current.isDrawing) {
        const ds = drawingState.current;
        ds.isDrawing = false;
        canvas.releasePointerCapture(e.pointerId);

        const { imageWidth, imageHeight } = useAppStore.getState();

        // Normalize negative drags
        const rawX = Math.min(ds.startX, ds.currentX);
        const rawY = Math.min(ds.startY, ds.currentY);
        const rawW = Math.abs(ds.currentX - ds.startX);
        const rawH = Math.abs(ds.currentY - ds.startY);

        // Clamp to image bounds
        const x = Math.max(0, rawX);
        const y = Math.max(0, rawY);
        const w = Math.min(rawW, imageWidth - x);
        const h = Math.min(rawH, imageHeight - y);

        if (w >= MIN_BOX_SIZE && h >= MIN_BOX_SIZE) {
          useAppStore.getState().addAnnotation([x, y, w, h]);
        }

        requestRedraw();
      }
    };

    const onPointerLeave = () => {
      useAppStore.getState().setCursorCoords(null);
    };

    // --- Space key tracking (for Space+drag pan) ---
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceHeld.current = true;
        if (!isPanning.current && !drawingState.current.isDrawing) {
          canvas.style.cursor = 'grab';
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceHeld.current = false;
        isPanning.current = false;
        canvas.style.cursor = 'crosshair';
      }
    };

    // Set initial cursor
    canvas.style.cursor = 'crosshair';

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [canvasRef, applyZoom, requestRedraw]);

  return { zoomIn, zoomOut, resetView, getDrawingState, cancelDrawing };
}

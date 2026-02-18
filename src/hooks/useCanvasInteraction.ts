import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { useAppStore } from '../store/useAppStore';
import { screenToImage, clamp, computeFitZoom } from '../lib/geometry';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '../lib/constants';

export function useCanvasInteraction(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const spaceHeld = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const cursorRafPending = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  // Apply zoom toward a given screen-space point
  const applyZoom = useCallback((newZoom: number, screenX: number, screenY: number) => {
    const { zoom: oldZoom, panX, panY, imageWidth, imageHeight } = useAppStore.getState();

    // Floor is the fit zoom: user can't zoom out smaller than fit-to-canvas.
    // Falls back to MIN_ZOOM if canvas/image dimensions aren't available yet.
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

    // --- Pan: middle-click or Space+left-click ---
    const onPointerDown = (e: PointerEvent) => {
      const isMiddle = e.button === 1;
      const isSpaceLeft = e.button === 0 && spaceHeld.current;
      if (!isMiddle && !isSpaceLeft) return;
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      const { panX, panY } = useAppStore.getState();
      panOrigin.current = { x: panX, y: panY };
      canvas.setPointerCapture(e.pointerId);
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

    const endPan = (e: PointerEvent) => {
      if (!isPanning.current) return;
      isPanning.current = false;
      canvas.releasePointerCapture(e.pointerId);
    };

    const onPointerLeave = () => {
      useAppStore.getState().setCursorCoords(null);
    };

    // --- Space key tracking (for Space+drag pan) ---
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') spaceHeld.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceHeld.current = false;
        // Cancel any active space-pan when space is released
        isPanning.current = false;
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', endPan);
    canvas.addEventListener('pointercancel', endPan);
    canvas.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endPan);
      canvas.removeEventListener('pointercancel', endPan);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [canvasRef, applyZoom]);

  return { zoomIn, zoomOut, resetView };
}

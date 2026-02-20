import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { useAppStore } from '../store/useAppStore';
import { screenToImage, clamp, computeFitZoom, pointInRect } from '../lib/geometry';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, MIN_BOX_SIZE, HANDLE_HALFSIZE_PX } from '../lib/constants';
import type { DragHandle, DragState } from '../lib/types';

export interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}


function hitTestHandle(
  ix: number,
  iy: number,
  bbox: [number, number, number, number],
  zoom: number,
): DragHandle | null {
  const [bx, by, bw, bh] = bbox;
  const tol = (HANDLE_HALFSIZE_PX * Math.max(1, zoom)) / zoom;

  // Corner and edge midpoint positions: [imageX, imageY, handle]
  const handles: [number, number, DragHandle][] = [
    [bx, by, 'nw'],
    [bx + bw, by, 'ne'],
    [bx, by + bh, 'sw'],
    [bx + bw, by + bh, 'se'],
    [bx + bw / 2, by, 'n'],
    [bx + bw / 2, by + bh, 's'],
    [bx, by + bh / 2, 'w'],
    [bx + bw, by + bh / 2, 'e'],
  ];

  for (const [hx, hy, handle] of handles) {
    if (Math.abs(ix - hx) <= tol && Math.abs(iy - hy) <= tol) {
      return handle;
    }
  }
  return null;
}

function cursorForHandle(handle: DragHandle | null): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'body':
      return 'move';
    default:
      return 'default';
  }
}

function computeDragBbox(
  original: [number, number, number, number],
  handle: DragHandle,
  dx: number,
  dy: number,
  imageWidth: number,
  imageHeight: number,
): [number, number, number, number] {
  let [x, y, w, h] = original;

  if (handle === 'body') {
    x = clamp(x + dx, 0, imageWidth - w);
    y = clamp(y + dy, 0, imageHeight - h);
    return [x, y, w, h];
  }

  // Resize: adjust edges based on handle
  if (handle === 'nw' || handle === 'w' || handle === 'sw') {
    const newX = clamp(x + dx, 0, x + w - MIN_BOX_SIZE);
    w = w + (x - newX);
    x = newX;
  }
  if (handle === 'ne' || handle === 'e' || handle === 'se') {
    w = Math.max(MIN_BOX_SIZE, w + dx);
    // Clamp right edge to image
    if (x + w > imageWidth) w = imageWidth - x;
  }
  if (handle === 'nw' || handle === 'n' || handle === 'ne') {
    const newY = clamp(y + dy, 0, y + h - MIN_BOX_SIZE);
    h = h + (y - newY);
    y = newY;
  }
  if (handle === 'sw' || handle === 's' || handle === 'se') {
    h = Math.max(MIN_BOX_SIZE, h + dy);
    // Clamp bottom edge to image
    if (y + h > imageHeight) h = imageHeight - y;
  }

  return [x, y, w, h];
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

  // Drag/resize state (ref-based for performance — no store updates during drag)
  const dragActive = useRef(false);
  const dragAnnotationId = useRef<string | null>(null);
  const dragHandle = useRef<DragHandle>('body');
  const dragStartImage = useRef({ x: 0, y: 0 });
  const dragOriginalBbox = useRef<[number, number, number, number]>([0, 0, 0, 0]);
  const dragPreviewBbox = useRef<[number, number, number, number] | null>(null);

  const dragState = useRef<DragState>({
    active: false,
    annotationId: null,
    handle: 'body',
    previewBbox: null,
  });

  const getDrawingState = useCallback((): DrawingState => drawingState.current, []);
  const getDragState = useCallback((): DragState => dragState.current, []);

  const cancelDrawing = useCallback(() => {
    if (drawingState.current.isDrawing) {
      drawingState.current.isDrawing = false;
      requestRedraw();
    }
  }, [requestRedraw]);

  const cancelDrag = useCallback(() => {
    if (dragActive.current) {
      dragActive.current = false;
      dragAnnotationId.current = null;
      dragPreviewBbox.current = null;
      dragState.current = { active: false, annotationId: null, handle: 'body', previewBbox: null };
      requestRedraw();
    }
  }, [requestRedraw]);

  // Apply zoom toward a given screen-space point
  const applyZoom = useCallback(
    (newZoom: number, screenX: number, screenY: number) => {
      const { zoom: oldZoom, panX, panY, imageWidth, imageHeight } = useAppStore.getState();

      const canvas = canvasRef.current;
      const minZoom =
        canvas && imageWidth && imageHeight
          ? computeFitZoom(
              canvas.width / (window.devicePixelRatio || 1),
              canvas.height / (window.devicePixelRatio || 1),
              imageWidth,
              imageHeight,
            )
          : MIN_ZOOM;

      const clamped = clamp(newZoom, minZoom, MAX_ZOOM);
      if (clamped === oldZoom) return;
      const newPanX = screenX - (screenX - panX) * (clamped / oldZoom);
      const newPanY = screenY - (screenY - panY) * (clamped / oldZoom);
      useAppStore.getState().setViewport(clamped, newPanX, newPanY);
    },
    [canvasRef],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getModeCursor = () => {
      const { editMode } = useAppStore.getState();
      return editMode === 'draw' ? 'crosshair' : 'default';
    };

    // --- Wheel: zoom / scroll ---
    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      const { zoom, panX, panY } = useAppStore.getState();

      if (e.ctrlKey || e.metaKey) {
        // Zoom toward cursor — must prevent browser zoom
        e.preventDefault();
        const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
        applyZoom(zoom + delta, e.offsetX, e.offsetY);
      } else if (e.shiftKey) {
        // Horizontal pan
        const d = e.deltaX || e.deltaY;
        useAppStore.getState().setViewport(zoom, panX - d, panY);
      } else {
        // Vertical pan
        useAppStore.getState().setViewport(zoom, panX, panY - e.deltaY);
      }
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

      // Left-click (no modifier) → mode-dependent behavior
      if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
        const { zoom, panX, panY, annotations, hiddenClassIds, editMode, selectedId } =
          useAppStore.getState();
        const [ix, iy] = screenToImage(e.offsetX, e.offsetY, zoom, panX, panY);

        if (editMode === 'draw') {
          // Drawing mode: always start drawing, ignore existing annotations
          useAppStore.getState().setSelected(null);
          drawingState.current = {
            isDrawing: true,
            startX: ix,
            startY: iy,
            currentX: ix,
            currentY: iy,
          };
          canvas.setPointerCapture(e.pointerId);
          return;
        }

        if (editMode === 'select') {
          // Check resize handles on currently selected annotation first
          if (selectedId) {
            const selectedAnn = annotations.find((a) => a.id === selectedId);
            if (selectedAnn && !hiddenClassIds.has(selectedAnn.classId)) {
              const handle = hitTestHandle(ix, iy, selectedAnn.bbox, zoom);
              if (handle) {
                // Start resize drag
                dragActive.current = true;
                dragAnnotationId.current = selectedAnn.id;
                dragHandle.current = handle;
                dragStartImage.current = { x: ix, y: iy };
                dragOriginalBbox.current = [...selectedAnn.bbox];
                dragPreviewBbox.current = [...selectedAnn.bbox];
                dragState.current = {
                  active: true,
                  annotationId: selectedAnn.id,
                  handle,
                  previewBbox: [...selectedAnn.bbox],
                };
                canvas.setPointerCapture(e.pointerId);
                return;
              }
            }
          }

          // Body hit-test all annotations (reverse order = topmost first)
          for (let i = annotations.length - 1; i >= 0; i--) {
            if (hiddenClassIds.has(annotations[i].classId)) continue;
            if (pointInRect(ix, iy, annotations[i].bbox)) {
              useAppStore.getState().setSelected(annotations[i].id);
              // Start move drag
              dragActive.current = true;
              dragAnnotationId.current = annotations[i].id;
              dragHandle.current = 'body';
              dragStartImage.current = { x: ix, y: iy };
              dragOriginalBbox.current = [...annotations[i].bbox];
              dragPreviewBbox.current = [...annotations[i].bbox];
              dragState.current = {
                active: true,
                annotationId: annotations[i].id,
                handle: 'body',
                previewBbox: [...annotations[i].bbox],
              };
              canvas.setPointerCapture(e.pointerId);
              return;
            }
          }

          // No hit → deselect
          useAppStore.getState().setSelected(null);
        }
        // editMode === 'idle' → do nothing
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

      // Drag/resize preview
      if (dragActive.current && dragAnnotationId.current) {
        const { zoom, panX, panY, imageWidth, imageHeight } = useAppStore.getState();
        const [ix, iy] = screenToImage(e.offsetX, e.offsetY, zoom, panX, panY);
        const dx = ix - dragStartImage.current.x;
        const dy = iy - dragStartImage.current.y;

        const preview = computeDragBbox(
          dragOriginalBbox.current,
          dragHandle.current,
          dx,
          dy,
          imageWidth,
          imageHeight,
        );
        dragPreviewBbox.current = preview;
        dragState.current = {
          active: true,
          annotationId: dragAnnotationId.current,
          handle: dragHandle.current,
          previewBbox: preview,
        };
        requestRedraw();
        return;
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
      if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        const { zoom } = useAppStore.getState();
        useAppStore
          .getState()
          .setViewport(zoom, panOrigin.current.x + dx, panOrigin.current.y + dy);
        return;
      }

      // Hover cursor in select mode
      const { editMode, selectedId, annotations, hiddenClassIds, zoom, panX, panY } =
        useAppStore.getState();
      if (editMode === 'select' && !spaceHeld.current) {
        const [ix, iy] = screenToImage(e.offsetX, e.offsetY, zoom, panX, panY);

        // Check handles on selected annotation
        if (selectedId) {
          const selectedAnn = annotations.find((a) => a.id === selectedId);
          if (selectedAnn && !hiddenClassIds.has(selectedAnn.classId)) {
            const handle = hitTestHandle(ix, iy, selectedAnn.bbox, zoom);
            if (handle) {
              canvas.style.cursor = cursorForHandle(handle);
              return;
            }
          }
        }

        // Check body hover
        for (let i = annotations.length - 1; i >= 0; i--) {
          if (hiddenClassIds.has(annotations[i].classId)) continue;
          if (pointInRect(ix, iy, annotations[i].bbox)) {
            canvas.style.cursor = 'move';
            return;
          }
        }
        canvas.style.cursor = 'default';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      // End pan
      if (isPanning.current) {
        isPanning.current = false;
        canvas.releasePointerCapture(e.pointerId);
        canvas.style.cursor = spaceHeld.current ? 'grab' : getModeCursor();
        return;
      }

      // End drag/resize
      if (dragActive.current && dragAnnotationId.current) {
        const preview = dragPreviewBbox.current;
        const original = dragOriginalBbox.current;

        if (
          preview &&
          (Math.abs(preview[0] - original[0]) > 0.5 ||
            Math.abs(preview[1] - original[1]) > 0.5 ||
            Math.abs(preview[2] - original[2]) > 0.5 ||
            Math.abs(preview[3] - original[3]) > 0.5)
        ) {
          useAppStore.getState().moveAnnotation(dragAnnotationId.current, preview);
        }

        dragActive.current = false;
        dragAnnotationId.current = null;
        dragPreviewBbox.current = null;
        dragState.current = {
          active: false,
          annotationId: null,
          handle: 'body',
          previewBbox: null,
        };
        canvas.releasePointerCapture(e.pointerId);
        requestRedraw();
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
        if (!isPanning.current && !drawingState.current.isDrawing && !dragActive.current) {
          canvas.style.cursor = 'grab';
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        spaceHeld.current = false;
        isPanning.current = false;
        canvas.style.cursor = getModeCursor();
      }
    };

    // Set initial cursor based on mode
    canvas.style.cursor = getModeCursor();

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

  return { getDrawingState, getDragState, cancelDrawing, cancelDrag };
}

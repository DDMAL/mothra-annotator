import { create } from 'zustand';
import type { Annotation } from '../lib/types';
import { CLASSES, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '../lib/constants';
import { clamp, computeFitZoom } from '../lib/geometry';

interface AppState {
  // Annotation state
  annotations: Annotation[];
  activeClassId: number;
  selectedId: string | null;
  undoStack: Annotation[][];

  // Image state
  imageName: string | null;
  imageWidth: number;
  imageHeight: number;

  // Canvas size (CSS pixels, updated by AnnotationCanvas on resize)
  canvasWidth: number;
  canvasHeight: number;

  // UI state
  boxOpacity: number;
  showLabels: boolean;
  lastSaved: number | null;

  // Viewport state
  zoom: number;
  panX: number;
  panY: number;
  cursorImageCoords: [number, number] | null;

  // Actions
  addAnnotation: (bbox: [number, number, number, number]) => void;
  deleteAnnotation: (id: string) => void;
  setActiveClass: (id: number) => void;
  setSelected: (id: string | null) => void;
  undo: () => void;
  clearAll: () => void;
  setOpacity: (value: number) => void;
  toggleLabels: () => void;
  setViewport: (zoom: number, panX: number, panY: number) => void;
  setCursorCoords: (coords: [number, number] | null) => void;
  setImageInfo: (name: string, width: number, height: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  restoreSession: (annotations: Annotation[]) => void;
  setLastSaved: (timestamp: number) => void;

  // Zoom actions (usable from Toolbar, keyboard shortcuts, etc.)
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  annotations: [],
  activeClassId: CLASSES[0].id,
  selectedId: null,
  undoStack: [],

  imageName: null,
  imageWidth: 0,
  imageHeight: 0,

  canvasWidth: 0,
  canvasHeight: 0,

  boxOpacity: 0.3,
  showLabels: true,
  lastSaved: null,

  zoom: 1,
  panX: 0,
  panY: 0,
  cursorImageCoords: null,

  // Actions
  addAnnotation: (bbox) =>
    set((state) => ({
      undoStack: [...state.undoStack, state.annotations],
      annotations: [
        ...state.annotations,
        {
          id: crypto.randomUUID(),
          classId: state.activeClassId,
          bbox,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  deleteAnnotation: (id) =>
    set((state) => ({
      undoStack: [...state.undoStack, state.annotations],
      annotations: state.annotations.filter((a) => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  setActiveClass: (id) => set({ activeClassId: id }),

  setSelected: (id) => set({ selectedId: id }),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const undoStack = [...state.undoStack];
      const annotations = undoStack.pop()!;
      return { undoStack, annotations, selectedId: null };
    }),

  clearAll: () =>
    set((state) => ({
      undoStack: [...state.undoStack, state.annotations],
      annotations: [],
      selectedId: null,
    })),

  setOpacity: (value) => set({ boxOpacity: value }),

  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  setViewport: (zoom, panX, panY) => set({ zoom, panX, panY }),

  setCursorCoords: (coords) => set({ cursorImageCoords: coords }),

  setImageInfo: (name, width, height) =>
    set({ imageName: name, imageWidth: width, imageHeight: height }),

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  restoreSession: (annotations) => set({ annotations, undoStack: [], selectedId: null }),

  setLastSaved: (timestamp) => set({ lastSaved: timestamp }),

  zoomIn: () => {
    const { zoom, panX, panY, canvasWidth, canvasHeight, imageWidth, imageHeight } =
      useAppStore.getState();
    const minZoom =
      canvasWidth && imageWidth
        ? computeFitZoom(canvasWidth, canvasHeight, imageWidth, imageHeight)
        : MIN_ZOOM;
    const newZoom = clamp(zoom + ZOOM_STEP, minZoom, MAX_ZOOM);
    if (newZoom === zoom) return;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const newPanX = cx - (cx - panX) * (newZoom / zoom);
    const newPanY = cy - (cy - panY) * (newZoom / zoom);
    useAppStore.getState().setViewport(newZoom, newPanX, newPanY);
  },

  zoomOut: () => {
    const { zoom, panX, panY, canvasWidth, canvasHeight, imageWidth, imageHeight } =
      useAppStore.getState();
    const minZoom =
      canvasWidth && imageWidth
        ? computeFitZoom(canvasWidth, canvasHeight, imageWidth, imageHeight)
        : MIN_ZOOM;
    const newZoom = clamp(zoom - ZOOM_STEP, minZoom, MAX_ZOOM);
    if (newZoom === zoom) return;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const newPanX = cx - (cx - panX) * (newZoom / zoom);
    const newPanY = cy - (cy - panY) * (newZoom / zoom);
    useAppStore.getState().setViewport(newZoom, newPanX, newPanY);
  },

  resetView: () => {
    const { canvasWidth, canvasHeight, imageWidth, imageHeight } = useAppStore.getState();
    if (!canvasWidth || !imageWidth) return;
    const fitZoom = computeFitZoom(canvasWidth, canvasHeight, imageWidth, imageHeight);
    const panX = (canvasWidth - imageWidth * fitZoom) / 2;
    const panY = (canvasHeight - imageHeight * fitZoom) / 2;
    useAppStore.getState().setViewport(fitZoom, panX, panY);
  },
}));

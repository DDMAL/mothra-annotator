import { create } from 'zustand';
import type { Annotation } from '../lib/types';
import { CLASSES } from '../lib/constants';

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

  // UI state
  boxOpacity: number;
  showLabels: boolean;

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
  restoreSession: (annotations: Annotation[]) => void;
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

  boxOpacity: 0.3,
  showLabels: true,

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

  restoreSession: (annotations) => set({ annotations, undoStack: [], selectedId: null }),
}));

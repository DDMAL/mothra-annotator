// TODO: Phase 2 — File reading, image dimensions, drag-and-drop
export function useImageLoader() {
  return {
    image: null as HTMLImageElement | null,
    imageName: '',
    imageWidth: 0,
    imageHeight: 0,
    loadImage: (_file: File) => {},
  };
}

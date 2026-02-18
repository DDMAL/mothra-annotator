import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { loadSession } from '../lib/storage';

export function useImageLoader() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState('');
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Unsupported file type. Please use PNG, JPEG, or WebP.');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageName(file.name);
        setImageWidth(img.naturalWidth);
        setImageHeight(img.naturalHeight);
        useAppStore.getState().setImageInfo(file.name, img.naturalWidth, img.naturalHeight);

        const saved = loadSession(file.name);
        if (
          saved &&
          saved.imageWidth === img.naturalWidth &&
          saved.imageHeight === img.naturalHeight
        ) {
          useAppStore.getState().restoreSession(saved.annotations);
        }
      };
      img.onerror = () => {
        setError('Failed to load image. The file may be corrupted or in an unsupported format.');
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  }, []);

  return { image, imageName, imageWidth, imageHeight, error, loadImage };
}

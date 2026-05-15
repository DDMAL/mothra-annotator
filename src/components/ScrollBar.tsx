import { useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { clamp } from '../lib/geometry';

const SCROLLBAR_THICKNESS = 13;
const MIN_THUMB_PX = 24;
const TRACK_PADDING = 2;

interface ScrollBarProps {
  orientation: 'horizontal' | 'vertical';
  contentSize: number;
  viewportSize: number;
  panOffset: number;
  trackLength: number;
  onPanChange: (newPan: number) => void;
}

function ScrollBar({
  orientation,
  contentSize,
  viewportSize,
  panOffset,
  trackLength,
  onPanChange,
}: ScrollBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartScreenPos = useRef(0);
  const dragStartPanOffset = useRef(0);

  const scrollRange = contentSize - viewportSize;
  const visibleFraction = viewportSize / contentSize;
  const rawThumbLength = trackLength * visibleFraction;
  const thumbLength = Math.max(MIN_THUMB_PX, rawThumbLength);
  const availableTrack = trackLength - thumbLength - 2 * TRACK_PADDING;
  const scrollProgress = clamp(-panOffset / scrollRange, 0, 1);
  const thumbOffset = TRACK_PADDING + scrollProgress * availableTrack;

  const isHorizontal = orientation === 'horizontal';

  const onThumbPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      isDragging.current = true;
      dragStartScreenPos.current = isHorizontal ? e.clientX : e.clientY;
      dragStartPanOffset.current = panOffset;
    },
    [isHorizontal, panOffset],
  );

  const onThumbPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const currentPos = isHorizontal ? e.clientX : e.clientY;
      const dragDelta = currentPos - dragStartScreenPos.current;
      if (availableTrack === 0) return;
      const panDelta = -(dragDelta / availableTrack) * scrollRange;
      const newPan = clamp(dragStartPanOffset.current + panDelta, viewportSize - contentSize, 0);
      onPanChange(newPan);
    },
    [isHorizontal, availableTrack, scrollRange, viewportSize, contentSize, onPanChange],
  );

  const onThumbPointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const onTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!trackRef.current || e.target !== trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickPos = isHorizontal ? e.clientX - rect.left : e.clientY - rect.top;
      const halfThumb = thumbLength / 2;
      const targetCenter = clamp(
        clickPos,
        TRACK_PADDING + halfThumb,
        trackLength - TRACK_PADDING - halfThumb,
      );
      if (availableTrack === 0) return;
      const newProgress = (targetCenter - TRACK_PADDING - halfThumb) / availableTrack;
      const newPan = -newProgress * scrollRange;
      onPanChange(newPan);
    },
    [isHorizontal, thumbLength, trackLength, availableTrack, scrollRange, onPanChange],
  );

  const trackStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: trackLength,
        height: SCROLLBAR_THICKNESS,
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderRadius: 6,
        pointerEvents: 'auto',
      }
    : {
        position: 'absolute',
        right: 0,
        top: 0,
        width: SCROLLBAR_THICKNESS,
        height: trackLength,
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderRadius: 6,
        pointerEvents: 'auto',
      };

  const thumbStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        left: thumbOffset,
        top: 1,
        width: thumbLength,
        height: SCROLLBAR_THICKNESS - 3,
        backgroundColor: 'rgba(100, 99, 99, 0.55)',
        borderRadius: 5,
        cursor: 'grab',
      }
    : {
        position: 'absolute',
        top: thumbOffset,
        right: 1,
        height: thumbLength,
        width: SCROLLBAR_THICKNESS - 3,
        backgroundColor: 'rgba(100, 99, 99, 0.55)',
        borderRadius: 5,
        cursor: 'grab',
      };

  return (
    <div ref={trackRef} style={trackStyle} onPointerDown={onTrackPointerDown}>
      <div
        style={thumbStyle}
        onPointerDown={onThumbPointerDown}
        onPointerMove={onThumbPointerMove}
        onPointerUp={onThumbPointerUp}
        onPointerCancel={onThumbPointerUp}
      />
    </div>
  );
}

export function ScrollBars() {
  const zoom = useAppStore((s) => s.zoom);
  const panX = useAppStore((s) => s.panX);
  const panY = useAppStore((s) => s.panY);
  const imageWidth = useAppStore((s) => s.imageWidth);
  const imageHeight = useAppStore((s) => s.imageHeight);
  const canvasWidth = useAppStore((s) => s.canvasWidth);
  const canvasHeight = useAppStore((s) => s.canvasHeight);

  const showH = imageWidth * zoom > canvasWidth;
  const showV = imageHeight * zoom > canvasHeight;
  const corner = showH && showV ? SCROLLBAR_THICKNESS : 0;

  const handlePanX = useCallback((newPanX: number) => {
    const { zoom, panY } = useAppStore.getState();
    useAppStore.getState().setViewport(zoom, newPanX, panY);
  }, []);

  const handlePanY = useCallback((newPanY: number) => {
    const { zoom, panX } = useAppStore.getState();
    useAppStore.getState().setViewport(zoom, panX, newPanY);
  }, []);

  if (!showH && !showV) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {showH && (
        <ScrollBar
          orientation="horizontal"
          contentSize={imageWidth * zoom}
          viewportSize={canvasWidth}
          panOffset={panX}
          trackLength={canvasWidth - corner}
          onPanChange={handlePanX}
        />
      )}
      {showV && (
        <ScrollBar
          orientation="vertical"
          contentSize={imageHeight * zoom}
          viewportSize={canvasHeight}
          panOffset={panY}
          trackLength={canvasHeight - corner}
          onPanChange={handlePanY}
        />
      )}
    </div>
  );
}

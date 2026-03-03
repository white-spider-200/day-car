import { useEffect, useMemo, useRef, useState } from 'react';

type VR360PlayerProps = {
  src: string;
  title: string;
  className?: string;
};

declare global {
  interface Window {
    THREE?: any;
  }
}

async function loadThreeRuntime(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }
  if (window.THREE) {
    return window.THREE;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-three-runtime="true"]') as HTMLScriptElement | null;
    if (existing) {
      if (window.THREE) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load THREE runtime')), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.src = '/vendor/three.global.js';
    script.async = true;
    script.dataset.threeRuntime = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load THREE runtime'));
    document.head.appendChild(script);
  });

  if (!window.THREE) {
    throw new Error('THREE runtime unavailable');
  }

  return window.THREE;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function VR360Player({ src, title, className = '' }: VR360PlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rendererRef = useRef<any | null>(null);
  const sceneRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const frameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const progress = useMemo(() => {
    if (!duration || !Number.isFinite(duration)) return 0;
    return Math.min(100, (currentTime / duration) * 100);
  }, [currentTime, duration]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    void (async () => {
      try {
        const THREE = await loadThreeRuntime();
        if (disposed) return;

        const video = document.createElement('video');
        video.src = src;
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        videoRef.current = video;
        setIsMuted(true);
        setIsPlaying(false);
        setDuration(0);
        setCurrentTime(0);
        setIsReady(false);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1100);
        camera.position.set(0, 0, 0.1);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth || 800, container.clientHeight || 450);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1);

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        let lon = 0;
        let lat = 0;
        let isInteracting = false;
        let downX = 0;
        let downY = 0;
        let downLon = 0;
        let downLat = 0;

        const handleResize = () => {
          const node = containerRef.current;
          const activeRenderer = rendererRef.current;
          const activeCamera = cameraRef.current;
          if (!node || !activeRenderer || !activeCamera) return;
          const w = node.clientWidth || 800;
          const h = node.clientHeight || 450;
          activeCamera.aspect = w / h;
          activeCamera.updateProjectionMatrix();
          activeRenderer.setSize(w, h);
        };

        const onMouseDown = (event: MouseEvent) => {
          isInteracting = true;
          downX = event.clientX;
          downY = event.clientY;
          downLon = lon;
          downLat = lat;
        };

        const onMouseMove = (event: MouseEvent) => {
          if (!isInteracting) return;
          lon = (downX - event.clientX) * 0.12 + downLon;
          lat = (event.clientY - downY) * 0.12 + downLat;
        };

        const onMouseUp = () => {
          isInteracting = false;
        };

        const onWheel = (event: WheelEvent) => {
          const activeCamera = cameraRef.current;
          if (!activeCamera) return;
          activeCamera.fov = Math.max(40, Math.min(95, activeCamera.fov + event.deltaY * 0.05));
          activeCamera.updateProjectionMatrix();
        };

        const onTouchStart = (event: TouchEvent) => {
          if (event.touches.length !== 1) return;
          isInteracting = true;
          downX = event.touches[0].clientX;
          downY = event.touches[0].clientY;
          downLon = lon;
          downLat = lat;
        };

        const onTouchMove = (event: TouchEvent) => {
          if (!isInteracting || event.touches.length !== 1) return;
          lon = (downX - event.touches[0].clientX) * 0.12 + downLon;
          lat = (event.touches[0].clientY - downY) * 0.12 + downLat;
        };

        const onTouchEnd = () => {
          isInteracting = false;
        };

        const onLoadedMetadata = () => {
          setDuration(video.duration);
          setIsReady(true);
        };
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onVolumeChange = () => setIsMuted(video.muted || video.volume === 0);

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('volumechange', onVolumeChange);

        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
        renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('resize', handleResize);
        handleResize();

        const animate = () => {
          const activeCamera = cameraRef.current;
          const activeRenderer = rendererRef.current;
          const activeScene = sceneRef.current;
          if (!activeCamera || !activeRenderer || !activeScene) return;

          lat = Math.max(-85, Math.min(85, lat));
          const phi = THREE.MathUtils.degToRad(90 - lat);
          const theta = THREE.MathUtils.degToRad(lon);
          const target = new THREE.Vector3(
            500 * Math.sin(phi) * Math.cos(theta),
            500 * Math.cos(phi),
            500 * Math.sin(phi) * Math.sin(theta)
          );
          activeCamera.lookAt(target);
          activeRenderer.render(activeScene, activeCamera);
          frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);

        cleanup = () => {
          if (frameRef.current) cancelAnimationFrame(frameRef.current);
          video.pause();
          video.removeAttribute('src');
          video.load();
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('timeupdate', onTimeUpdate);
          video.removeEventListener('play', onPlay);
          video.removeEventListener('pause', onPause);
          video.removeEventListener('volumechange', onVolumeChange);
          renderer.domElement.removeEventListener('mousedown', onMouseDown);
          renderer.domElement.removeEventListener('wheel', onWheel);
          renderer.domElement.removeEventListener('touchstart', onTouchStart);
          renderer.domElement.removeEventListener('touchmove', onTouchMove);
          renderer.domElement.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          window.removeEventListener('resize', handleResize);
          material.dispose();
          texture.dispose();
          geometry.dispose();
          renderer.dispose();
          container.innerHTML = '';
        };
      } catch {
        if (disposed) return;

        const video = document.createElement('video');
        video.src = src;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.style.position = 'absolute';
        video.style.left = '50%';
        video.style.top = '50%';
        video.style.width = '220%';
        video.style.height = '140%';
        video.style.objectFit = 'cover';
        video.style.transform = 'translate(-50%, -50%)';
        video.style.willChange = 'transform';
        videoRef.current = video;
        setIsMuted(true);
        setIsPlaying(false);
        setDuration(0);
        setCurrentTime(0);
        setIsReady(false);

        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.cursor = 'grab';
        container.appendChild(video);

        let offsetX = 0;
        let offsetY = 0;
        let dragging = false;
        let downX = 0;
        let downY = 0;
        let baseX = 0;
        let baseY = 0;

        const limits = () => {
          const w = container.clientWidth || 1;
          const h = container.clientHeight || 1;
          return {
            maxX: Math.max(80, Math.round(w * 0.55)),
            maxY: Math.max(30, Math.round(h * 0.22))
          };
        };

        const applyTransform = () => {
          const { maxX, maxY } = limits();
          offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
          offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
          video.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
        };

        const onMouseDown = (event: MouseEvent) => {
          dragging = true;
          downX = event.clientX;
          downY = event.clientY;
          baseX = offsetX;
          baseY = offsetY;
          container.style.cursor = 'grabbing';
        };
        const onMouseMove = (event: MouseEvent) => {
          if (!dragging) return;
          offsetX = baseX + (downX - event.clientX) * 0.9;
          offsetY = baseY + (downY - event.clientY) * 0.55;
          applyTransform();
        };
        const onMouseUp = () => {
          dragging = false;
          container.style.cursor = 'grab';
        };

        const onTouchStart = (event: TouchEvent) => {
          if (event.touches.length !== 1) return;
          dragging = true;
          downX = event.touches[0].clientX;
          downY = event.touches[0].clientY;
          baseX = offsetX;
          baseY = offsetY;
        };
        const onTouchMove = (event: TouchEvent) => {
          if (!dragging || event.touches.length !== 1) return;
          offsetX = baseX + (downX - event.touches[0].clientX) * 0.9;
          offsetY = baseY + (downY - event.touches[0].clientY) * 0.55;
          applyTransform();
        };
        const onTouchEnd = () => {
          dragging = false;
        };

        const onLoadedMetadata = () => {
          setDuration(video.duration);
          setIsReady(true);
        };
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onVolumeChange = () => setIsMuted(video.muted || video.volume === 0);

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('volumechange', onVolumeChange);

        container.addEventListener('mousedown', onMouseDown);
        container.addEventListener('touchstart', onTouchStart, { passive: true });
        container.addEventListener('touchmove', onTouchMove, { passive: true });
        container.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        cleanup = () => {
          video.pause();
          video.removeAttribute('src');
          video.load();
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('timeupdate', onTimeUpdate);
          video.removeEventListener('play', onPlay);
          video.removeEventListener('pause', onPause);
          video.removeEventListener('volumechange', onVolumeChange);
          container.removeEventListener('mousedown', onMouseDown);
          container.removeEventListener('touchstart', onTouchStart);
          container.removeEventListener('touchmove', onTouchMove);
          container.removeEventListener('touchend', onTouchEnd);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          container.innerHTML = '';
          container.style.cursor = 'default';
        };
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [src]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }
    video.pause();
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const seekTo = (nextPercent: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const safePercent = Math.max(0, Math.min(100, nextPercent));
    video.currentTime = (safePercent / 100) * duration;
    setCurrentTime(video.currentTime);
  };

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
        aria-label={title}
      />
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold text-slate-600">
          Drag to look around. Use mouse wheel to zoom. On mobile, swipe to move view.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white"
            disabled={!isReady}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-borderGray px-3 py-1.5 text-xs font-bold text-textMain"
            disabled={!isReady}
          >
            Restart
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg border border-borderGray px-3 py-1.5 text-xs font-bold text-textMain"
            disabled={!isReady}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <span className="text-xs font-semibold text-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={(event) => seekTo(Number(event.target.value))}
          className="mt-3 w-full accent-primary"
          disabled={!isReady}
          aria-label="Timeline"
        />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  ExternalLink,
  Film,
  Images,
  FolderOpen,
  Volume2,
  VolumeX,
  AlertCircle,
  Maximize2,
  X,
  Heart,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { HighlightPublicItem, HighlightSettings, FolderImageItem } from '../types/highlights';

// ============================================================================
// 1. VIDEO ROW COMPONENT (Autoplay enabled)
// ============================================================================
interface VideoHighlightRowProps {
  highlight: HighlightPublicItem;
}

const VideoHighlightRow: React.FC<VideoHighlightRowProps> = ({ highlight }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);
  const rowVideoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Compute direct stream URL if available
  const streamUrl = React.useMemo(() => {
    if (highlight.stream_url) {
      if (highlight.stream_url.startsWith('http://') || highlight.stream_url.startsWith('https://')) {
        return highlight.stream_url;
      }
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api').replace(/\/api\/?$/, '');
      return `${baseUrl}${highlight.stream_url.startsWith('/') ? highlight.stream_url : `/${highlight.stream_url}`}`;
    }
    if (highlight.drive_file_id) {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api').replace(/\/api\/?$/, '');
      return `${baseUrl}/api/highlights/stream/${highlight.drive_file_id}/`;
    }
    return '';
  }, [highlight.stream_url, highlight.drive_file_id]);

  const embedUrl =
    highlight.embed_url ||
    (highlight.drive_file_id
      ? `https://drive.google.com/file/d/${highlight.drive_file_id}/preview`
      : '');

  const posterUrl =
    highlight.thumbnail_url ||
    (highlight.drive_file_id
      ? `https://drive.google.com/thumbnail?id=${highlight.drive_file_id}&sz=w1200`
      : undefined);

  return (
    <>
      <section
        aria-label={`Video Highlight: ${highlight.title}`}
        className="relative overflow-hidden rounded-3xl bg-stone-950 border border-stone-200/80 dark:border-stone-800 shadow-xl group select-none"
      >
        {/* Top Header Bar */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500 text-stone-950 shadow-sm shrink-0">
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Featured Video</span>
              <span className="sm:hidden">Video</span>
            </span>
            <h3 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
              {highlight.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Fullscreen Lightbox Button */}
            <button
              type="button"
              onClick={() => {
                if (rowVideoRef.current && !rowVideoRef.current.paused) {
                  rowVideoRef.current.pause();
                }
                setIsLightboxOpen(true);
              }}
              aria-label="View Fullscreen Video"
              className="w-8 h-8 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors border border-stone-700/60"
              title="Expand Fullscreen Video"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Google Drive Link */}
            {highlight.drive_url && (
              <a
                href={highlight.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700/60"
                title="Open in Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Drive</span>
              </a>
            )}
          </div>
        </div>

        {/* Embedded Video Canvas - Responsive 16:9 aspect ratio */}
        <div className="highlight-video-container relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {streamUrl && !streamFailed ? (
            <video
              ref={rowVideoRef}
              src={streamUrl}
              poster={posterUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-cover object-center"
              onError={() => setStreamFailed(true)}
            >
              Your browser does not support the video tag.
            </video>
          ) : embedUrl ? (
            <>
              <iframe
                src={embedUrl}
                title={highlight.title}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
              {/* Overlay blocker for Google Drive popout icon to prevent accidental external redirects on mobile */}
              <div
                className="absolute top-0 right-0 w-16 h-12 z-10 pointer-events-auto cursor-default"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="Watch inside Shema"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-stone-400">
              <Film className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs">No video URL available</p>
            </div>
          )}
        </div>

        {/* Description Footer Bar */}
        {highlight.description && (
          <div className="p-4 sm:p-5 bg-stone-900 border-t border-stone-800">
            <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed">
              {highlight.description}
            </p>
          </div>
        )}
      </section>

      {/* Interactive Fullscreen Video Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white min-w-0 flex-1 mr-3">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 text-xs font-black uppercase shrink-0">
                  Video
                </span>
                <span className="text-sm font-bold text-stone-200 truncate">
                  {highlight.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {highlight.drive_url && (
                  <a
                    href={highlight.drive_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-700/60"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Open in Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label="Close fullscreen video"
                  className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors border border-stone-700/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Video Canvas */}
            <div
              className="relative flex-1 flex items-center justify-center p-1 sm:p-4 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="highlight-video-container relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-stone-800 bg-black">
                {streamUrl && !streamFailed ? (
                  <video
                    ref={modalVideoRef}
                    src={streamUrl}
                    poster={posterUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain object-center"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : embedUrl ? (
                  <>
                    <iframe
                      src={embedUrl}
                      title={highlight.title}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                    <div
                      className="absolute top-0 right-0 w-16 h-12 z-10 pointer-events-auto cursor-default"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-stone-400">
                    <Film className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs">No video URL available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Caption */}
            {highlight.description && (
              <div
                className="text-center py-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto font-serif">
                  {highlight.description}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
// ============================================================================
// 2. 3D COVERFLOW IMAGE CAROUSEL COMPONENT
// Interactive dynamic rotations, depth offsets, and perspective alignment
// ============================================================================
interface ImageHighlightRowProps {
  highlight: HighlightPublicItem;
  settings: HighlightSettings;
}

interface FloatingHeartItem {
  id: number;
  x: number;
}

const ImageHighlightRow: React.FC<ImageHighlightRowProps> = ({ highlight, settings }) => {
  // Determine slides: either extracted folder images, or the single highlight image
  const slides = React.useMemo(() => {
    if (highlight.folder_images && highlight.folder_images.length > 0) {
      return highlight.folder_images.map((f: FolderImageItem, idx: number) => {
        // Generate an aesthetic category tag like in the reference design
        const cleanName = f.name.replace(/\.[^/.]+$/, '');
        const tagOptions = ['GALLERY', 'HIGHLIGHT', 'DEVOTION', 'COMMUNITY', 'MEMORIES', 'FELLOWSHIP'];
        const tag = tagOptions[idx % tagOptions.length];
        return {
          id: f.id,
          name: cleanName || `Image ${idx + 1}`,
          url: f.direct_url || `https://lh3.googleusercontent.com/d/${f.id}`,
          fallbackUrl: f.image_url || `https://drive.google.com/thumbnail?id=${f.id}&sz=w1200`,
          tag,
          index: idx,
        };
      });
    }
    // Single image fallback
    return [
      {
        id: highlight.id,
        name: highlight.title,
        url:
          highlight.direct_image_url ||
          `https://lh3.googleusercontent.com/d/${highlight.drive_file_id}`,
        fallbackUrl:
          highlight.preview_url ||
          `https://drive.google.com/thumbnail?id=${highlight.drive_file_id}&sz=w1200`,
        tag: 'FEATURED',
        index: 0,
      },
    ];
  }, [highlight]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgFallback, setImgFallback] = useState<Record<string, boolean>>({});
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [likes, setLikes] = useState(24);
  const [hasLiked, setHasLiked] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeartItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive window listener for 3D perspective spacing
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const total = slides.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentSlideIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentSlideIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay timer with auto-rotation setting
  useEffect(() => {
    if (!settings.auto_rotate || isPaused || isHovered || total <= 1 || isLightboxOpen) {
      return;
    }

    const intervalMs = Math.max(3, settings.carousel_interval || 4) * 1000;
    const timer = setInterval(() => {
      nextSlide();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.auto_rotate, settings.carousel_interval, isPaused, isHovered, total, isLightboxOpen, nextSlide]);

  // Keyboard navigation when hovered or active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false);
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
      } else if (isHovered) {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, isHovered, nextSlide, prevSlide]);

  const activeSlide = slides[currentSlideIndex] || slides[0];

  // Fun interactive like button with floating particle hearts
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikes((prev) => (hasLiked ? prev : prev + 1));
    setHasLiked(true);
    const newHeart: FloatingHeartItem = {
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 50,
    };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1200);
  };

  // Helper to compute 3D Coverflow transform values for each card
  const getCardTransform = (index: number) => {
    let offset = index - currentSlideIndex;

    // Shortest circular offset for seamless cycling
    if (total > 3) {
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
    }

    const isCenter = offset === 0;
    const absOffset = Math.abs(offset);
    // On mobile, limit to immediate adjacent cards to keep center hero card unobscured
    const isVisible = absOffset <= (isMobile ? 2 : 3);
    const direction = offset < 0 ? -1 : 1;

    // Spacing calibrated for desktop vs mobile (110px on mobile reveals center photo cleanly)
    const baseSpacing = isMobile ? 110 : 160;
    const stepSpacing = isMobile ? 60 : 100;
    const xTranslate = isCenter ? 0 : direction * (baseSpacing + (absOffset - 1) * stepSpacing);

    // Left cards rotate positive (+42deg on mobile), right cards rotate negative (-42deg on mobile)
    const rotateY = isCenter ? 0 : direction * (isMobile ? -42 : -38);
    const scale = isCenter ? (isMobile ? 1.02 : 1.05) : Math.max(0.68, 1 - absOffset * (isMobile ? 0.20 : 0.13));
    const zIndex = isCenter ? 40 : Math.max(1, 30 - absOffset * 5);
    const opacity = isVisible ? (isCenter ? 1 : Math.max(0.2, (isMobile ? 0.75 : 0.9) - absOffset * (isMobile ? 0.35 : 0.25))) : 0;
    const brightness = isCenter ? 1 : Math.max(0.4, 0.75 - absOffset * 0.15);

    return {
      x: xTranslate,
      rotateY,
      scale,
      zIndex,
      opacity,
      filter: `brightness(${brightness})`,
      isVisible,
      isCenter,
    };
  };

  return (
    <section
      aria-label={`3D Coverflow Carousel: ${highlight.title}`}
      className="relative overflow-hidden rounded-3xl bg-[#0c0d12] border border-stone-800/90 shadow-2xl group select-none transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Header Bar with Category Badge and Controls */}
      <div className="px-3.5 sm:px-5 py-3 sm:py-4 bg-stone-900/90 backdrop-blur-md border-b border-stone-800/80 flex items-center justify-between gap-2 sm:gap-3 relative z-30">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 shadow-sm shrink-0">
            {highlight.is_folder ? (
              <>
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D Photo Directory</span>
                <span className="sm:hidden">Gallery</span>
              </>
            ) : (
              <>
                <Images className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D Coverflow</span>
                <span className="sm:hidden">Gallery</span>
              </>
            )}
          </span>
          <h3 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
            {highlight.title}
          </h3>
          {slides.length > 1 && (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-stone-800/80 text-stone-300 border border-stone-700/60 shrink-0">
              {slides.length} Photos
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Auto-rotate toggle */}
          {slides.length > 1 && (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
              className="w-8 h-8 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors border border-stone-700/60"
              title={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 ml-0.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Fullscreen Lightbox Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="View Fullscreen"
            className="w-8 h-8 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors border border-stone-700/60"
            title="Expand Fullscreen Lightbox"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Google Drive Link */}
          <a
            href={highlight.drive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700/60"
            title="Open in Google Drive"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Drive</span>
          </a>
        </div>
      </div>

      {/* 2. Story-Style Segmented Progress Bar across top */}
      {slides.length > 1 && (
        <div className="px-4 sm:px-5 pt-3 pb-1 flex items-center gap-1.5 w-full bg-[#0c0d12]">
          {slides.map((_, idx) => (
            <button
              key={`progress-${idx}`}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              aria-label={`Jump to slide ${idx + 1}`}
              className="flex-1 h-1 rounded-full overflow-hidden bg-stone-800/80 hover:bg-stone-700 transition-colors relative cursor-pointer"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx === currentSlideIndex
                    ? 'w-full bg-amber-400 shadow-sm shadow-amber-400/50'
                    : idx < currentSlideIndex
                    ? 'w-full bg-stone-500'
                    : 'w-0'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. Main 3D Coverflow Stage */}
      <div
        className="relative w-full h-[360px] sm:h-[460px] md:h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Ambient Radial Spotlight behind center card */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[500px] h-[350px] bg-amber-500/[0.08] blur-3xl rounded-full transform -translate-y-6" />
          <div className="w-[300px] h-[200px] bg-purple-500/[0.05] blur-3xl rounded-full" />
        </div>

        {/* Floor Horizon & Stage Depth Shadow */}
        <div className="absolute bottom-6 inset-x-8 h-8 bg-black/90 blur-xl rounded-full pointer-events-none z-10" />
        <div className="absolute bottom-4 inset-x-24 h-4 bg-amber-400/10 blur-2xl rounded-full pointer-events-none z-10" />

        {/* Interactive Drag Stage */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x > 40 || info.velocity.x > 200) {
              prevSlide();
            } else if (info.offset.x < -40 || info.velocity.x < -200) {
              nextSlide();
            }
          }}
          className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {slides.map((slide, idx) => {
            const transform = getCardTransform(idx);
            if (!transform.isVisible) return null;

            return (
              <motion.div
                key={slide.id + '-' + idx}
                animate={{
                  x: transform.x,
                  rotateY: transform.rotateY,
                  scale: transform.scale,
                  zIndex: transform.zIndex,
                  opacity: transform.opacity,
                  filter: transform.filter,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 26,
                  mass: 0.9,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (transform.isCenter) {
                    setIsLightboxOpen(true);
                  } else {
                    setCurrentSlideIndex(idx);
                  }
                }}
                onDoubleClick={handleLike}
                style={{
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center center',
                  WebkitBoxReflect:
                    'below 4px linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.2) 100%)',
                }}
                className={`absolute w-[215px] sm:w-[270px] md:w-[300px] h-[290px] sm:h-[370px] md:h-[410px] rounded-2xl overflow-hidden cursor-pointer select-none border transition-shadow duration-300 ${
                  transform.isCenter
                    ? 'border-amber-400/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30'
                    : 'border-white/10 hover:border-white/25 shadow-2xl shadow-black/80'
                }`}
              >
                {/* Fallback error display */}
                {imgError[slide.id] ? (
                  <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center p-6 text-center text-stone-400">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-xs font-semibold text-stone-300">{highlight.title}</span>
                    <span className="text-[10px] text-stone-500 mt-1">Image preview unavailable</span>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <img
                      src={imgFallback[slide.id] ? slide.fallbackUrl : slide.url}
                      alt={`${highlight.title} - photo ${idx + 1}`}
                      onError={() => {
                        if (!imgFallback[slide.id]) {
                          setImgFallback((prev) => ({ ...prev, [slide.id]: true }));
                        } else {
                          setImgError((prev) => ({ ...prev, [slide.id]: true }));
                        }
                      }}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 pointer-events-none"
                    />

                    {/* Gradient shading for photo depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Card Top Category Pill */}
                    <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/20 shadow-md">
                        {slide.tag}
                      </span>
                    </div>

                    {/* Center Card Zoom Hint */}
                    {transform.isCenter && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] z-30">
                        <span className="px-3.5 py-1.5 rounded-xl bg-black/80 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-lg">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                          Click to Expand
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Floating Chevrons on sides */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous 3D slide"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700/80 hover:border-amber-400/50 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next 3D slide"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700/80 hover:border-amber-400/50 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>

      {/* 4. Active Slide Details & Fun Interactive Elements */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-[#0c0d12] border-t border-stone-800/80 flex flex-col items-center text-center relative z-20">
        <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {slides.length > 1
            ? `${activeSlide.tag} · PHOTO ${currentSlideIndex + 1} OF ${slides.length}`
            : 'FEATURED PHOTO'}
        </span>

        <h3 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight mt-1 max-w-xl">
          {highlight.title}
        </h3>

        {highlight.description && (
          <p className="text-xs sm:text-sm text-stone-300 font-serif max-w-xl mt-1 line-clamp-2 leading-relaxed">
            {highlight.description}
          </p>
        )}

        {/* Fun Interactive Reactions Bar */}
        <div className="mt-3.5 sm:mt-4 flex items-center gap-3">
          {/* Like / Heart reaction with floating particles */}
          <div className="relative">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20'
                  : 'bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white border-stone-700/70'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform ${
                  hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-rose-400'
                }`}
              />
              <span>{likes}</span>
            </button>

            {/* Floating Heart Particles */}
            <AnimatePresence>
              {floatingHearts.map((h) => (
                <motion.div
                  key={h.id}
                  initial={{ y: 0, x: h.x, opacity: 1, scale: 0.8 }}
                  animate={{ y: -70, opacity: 0, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="absolute left-1/2 bottom-full pointer-events-none text-rose-500"
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Quick Expand Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-800/90 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors border border-stone-700/70"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Expand</span>
          </button>
        </div>
      </div>

      {/* 5. Clickable Thumbnail Filmstrip along bottom for fast navigation */}
      {slides.length > 1 && (
        <div className="p-3 bg-stone-950 border-t border-stone-800/90 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide px-4">
          {slides.map((s, idx) => (
            <button
              key={`thumb-${s.id}-${idx}`}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              aria-label={`Jump to photo ${idx + 1}`}
              className={`relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border transition-all duration-300 ${
                idx === currentSlideIndex
                  ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md shadow-amber-400/20'
                  : 'border-stone-800 opacity-50 hover:opacity-100 hover:border-stone-600'
              }`}
            >
              <img
                src={imgFallback[s.id] ? s.fallbackUrl : s.url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 6. Interactive Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Lightbox Header */}
            <div
              className="flex items-center justify-between z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-white">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 text-xs font-black uppercase">
                  {activeSlide.tag}
                </span>
                <span className="text-sm font-bold text-stone-200">
                  {currentSlideIndex + 1} / {slides.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={highlight.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open in Drive</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label="Close lightbox"
                  className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Canvas with Prev/Next Navigation */}
            <div
              className="relative flex-1 flex items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {slides.length > 1 && (
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous photo"
                  className="absolute left-2 sm:left-6 z-20 w-12 h-12 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <motion.img
                key={activeSlide.id}
                src={imgFallback[activeSlide.id] ? activeSlide.fallbackUrl : activeSlide.url}
                alt={`${highlight.title} - photo ${currentSlideIndex + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-stone-800"
              />

              {slides.length > 1 && (
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next photo"
                  className="absolute right-2 sm:right-6 z-20 w-12 h-12 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white border border-stone-700 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Footer Caption */}
            <div
              className="text-center py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-base sm:text-lg font-black text-white">
                {highlight.title}
                {slides.length > 1 && (
                  <span className="text-stone-400 text-sm font-normal ml-2">
                    ({currentSlideIndex + 1} of {slides.length})
                  </span>
                )}
              </h4>
              {highlight.description && (
                <p className="text-xs sm:text-sm text-stone-400 max-w-lg mx-auto font-serif mt-0.5">
                  {highlight.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

// ============================================================================
// 3. MAIN COMPONENT: Renders each available, unexpired highlight in its own row
// ============================================================================
export const HighlightsCarousel: React.FC = () => {
  const [highlights, setHighlights] = useState<HighlightPublicItem[]>([]);
  const [settings, setSettings] = useState<HighlightSettings>({
    default_duration_days: 7,
    carousel_interval: 4,
    auto_rotate: true,
    max_visible: 10,
    is_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchHighlights = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getHomeHighlights();
      if (res && res.highlights) {
        setHighlights(res.highlights || []);
        if (res.settings) {
          setSettings(res.settings);
        }
      } else {
        setHighlights([]);
      }
    } catch {
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  // If disabled or empty, cleanly hide
  if (!settings.is_enabled || (!isLoading && highlights.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-full h-72 sm:h-80 rounded-3xl bg-stone-100 dark:bg-stone-900/60 animate-pulse border border-stone-200/80 dark:border-stone-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-stone-400">
          <Sparkles className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">Loading highlights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Community Highlights ({highlights.length})
        </span>
      </div>

      {/* Render each available and unexpired highlight in its own new row */}
      <div className="space-y-6">
        {highlights.map((highlight) => {
          if (highlight.media_type === 'video') {
            return <VideoHighlightRow key={highlight.id} highlight={highlight} />;
          }
          return (
            <ImageHighlightRow
              key={highlight.id}
              highlight={highlight}
              settings={settings}
            />
          );
        })}
      </div>
    </div>
  );
};

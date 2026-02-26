import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const bgImages = [
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1920", // Calm Meditation
  "https://images.unsplash.com/photo-1516589174184-c685ca3d142d?auto=format&fit=crop&q=80&w=1920", // Soft light/Nature
  "https://images.unsplash.com/photo-1499209974431-9dac3e74a131?auto=format&fit=crop&q=80&w=1920"  // Peaceful sky
];

export default function DynamicBackground() {
  const [index, setIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Background video URL (Pexels calm nature video)
  const videoUrl = "https://player.vimeo.com/external/434045526.sd.mp4?s=c27df3410659635f75607b9e782d8c323f4a4788&profile_id=164&oauth2_token_id=57447761";

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % bgImages.length);
    }, 8000); // Change image every 8 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-30' : 'opacity-0'
        }`}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Fallback Animated Image Slider (Visible if video is low opacity or loading) */}
      {!videoLoaded && (
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={bgImages[index]}
              alt=""
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modern Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white" />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-60" />
    </div>
  );
}

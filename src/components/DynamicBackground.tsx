import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const bgImages = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1920", // Therapist engaged in talk
  "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=1920", // Professional session context
  "https://images.unsplash.com/photo-1516584224416-86e16bd74442?auto=format&fit=crop&q=80&w=1920", // Patient and therapist talking
  "https://images.unsplash.com/photo-1582213726895-42ac0288b77d?auto=format&fit=crop&q=80&w=1920", // Supportive session conversation
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1920"  // One-on-one therapy consultation
];

export default function DynamicBackground() {
  const [index, setIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Background video URL (Pexels calm nature video)
  const videoUrl = "https://player.vimeo.com/external/434045526.sd.mp4?s=c27df3410659635f75607b9e782d8c323f4a4788&profile_id=164&oauth2_token_id=57447761";

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % bgImages.length);
    }, 6000); // Faster: Change image every 6 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Layered Animated Image Slider with Ken Burns Effect */}
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.5, scale: 1.25 }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 2 },
            scale: { duration: 6, ease: "linear" } 
          }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={bgImages[index]}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Background Video (Overlayed with very low opacity) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-5' : 'opacity-0'
        }`}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Modern Overlay Gradient - Adjusted for visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/20 to-white/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40" />
    </div>
  );
}

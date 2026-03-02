import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Import all 8 therapy videos
import v1 from '../assets/media/therapy-man-psychiatrist.mp4';
import v2 from '../assets/media/therapy-pregnant-woman.mp4';
import v3 from '../assets/media/therapy-doctor-online.mp4';
import v4 from '../assets/media/therapy-black-man-consultation.mp4';
import v5 from '../assets/media/therapy-woman-mental-health.mp4';
import v6 from '../assets/media/therapy-stress-concept.mp4';
import v7 from '../assets/media/therapy-online-laptop.mp4';
import v8 from '../assets/media/therapy-elderly-care.mp4';

const bgVideos = [v1, v2, v3, v4, v5, v6, v7, v8];

const bgImages = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=1920", // Therapist engaged in talk
  "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=1920", // Professional session context
  "https://images.unsplash.com/photo-1516584224416-86e16bd74442?auto=format&fit=crop&q=80&w=1920", // Patient and therapist talking
  "https://images.unsplash.com/photo-1582213726895-42ac0288b77d?auto=format&fit=crop&q=80&w=1920", // Supportive session conversation
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1920"  // One-on-one therapy consultation
];

export default function DynamicBackground() {
  const [index, setIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % bgImages.length);
      // Change video every 2 image cycles (12 seconds)
      setVideoIndex((prev) => (prev + 1) % bgVideos.length);
    }, 6000); 
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
      <AnimatePresence mode="wait">
        <motion.video
          key={videoIndex}
          autoPlay
          muted
          loop
          playsInline
          initial={{ opacity: 0 }}
          animate={{ opacity: videoLoaded ? 0.08 : 0 }}
          exit={{ opacity: 0 }}
          onLoadedData={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        >
          <source src={bgVideos[videoIndex]} type="video/mp4" />
        </motion.video>
      </AnimatePresence>

      {/* Modern Overlay Gradient - Adjusted for visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/20 to-white/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40" />
    </div>
  );
}

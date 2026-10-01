import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DrinkBanner({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="drink"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="absolute inset-x-0 top-6 flex justify-center z-30 pointer-events-none"
        >
          <div className="bg-black/80 border-2 border-neon text-neon font-display uppercase font-bold text-3xl md:text-5xl tracking-widest px-8 py-3 rounded-2xl shadow-glow-neon animate-zap">
            DRINK!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
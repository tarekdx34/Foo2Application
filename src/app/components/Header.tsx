import { motion } from "motion/react";
import logoImage from "../../assets/Logo.svg";

export function Header() {
  return (
    <header className="w-full py-3 md:py-4 flex flex-col items-center justify-center shrink-0">
      <motion.div
        className="relative"
        animate={{
          y: [0, -10, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{
          scale: 1.12,
          rotate: [0, -8, 8, -5, 5, 0],
          transition: { duration: 0.5, ease: "easeInOut" },
        }}
        whileTap={{ scale: 0.92, rotate: 0 }}
      >
        <img
          src={logoImage}
          alt="فووق"
          className="w-28 h-28 md:w-36 md:h-36 object-contain"
          style={{
            filter: "drop-shadow(0 6px 12px rgba(120,53,15,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        />
      </motion.div>
    </header>
  );
}

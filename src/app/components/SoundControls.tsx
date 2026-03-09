import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSoundManager } from '../../hooks/useSoundManager';

interface SoundControlsProps {
  className?: string;
}

export function SoundControls({ className = '' }: SoundControlsProps) {
  const { isMuted, toggleMute } = useSoundManager();

  return (
    <motion.button
      onClick={toggleMute}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      className={`w-10 h-10 rounded-full border-3 border-amber-900 flex items-center justify-center shadow-lg transition-colors ${
        isMuted
          ? 'bg-gray-500/80 text-gray-200'
          : 'bg-amber-500 text-white'
      } ${className}`}
      aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
      title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
    >
      {isMuted
        ? <VolumeX className="w-5 h-5" />
        : <Volume2 className="w-5 h-5" />
      }
    </motion.button>
  );
}

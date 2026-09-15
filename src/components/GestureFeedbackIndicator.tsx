import React from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { GestureFeedback } from '../hooks/useMobileSwipe';

interface GestureFeedbackIndicatorProps {
  feedback: GestureFeedback | null;
}

export const GestureFeedbackIndicator: React.FC<GestureFeedbackIndicatorProps> = ({
  feedback,
}) => {
  if (!feedback) return null;

  return (
    <div
      key={feedback.id}
      id="gesture-feedback-indicator"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 slide-in-from-top-2"
    >
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 dark:bg-white/90 text-white dark:text-gray-900 shadow-xl backdrop-blur-md border border-white/20 dark:border-black/10 text-xs font-semibold select-none">
        {feedback.icon === 'back' && (
          <div className="w-4 h-4 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-3 h-3 text-white dark:text-gray-900" />
          </div>
        )}
        {feedback.icon === 'close' && (
          <div className="w-4 h-4 rounded-full bg-rose-500/80 text-white flex items-center justify-center shrink-0">
            <X className="w-3 h-3" />
          </div>
        )}
        {feedback.icon === 'forward' && (
          <div className="w-4 h-4 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center shrink-0">
            <ArrowRight className="w-3 h-3 text-white dark:text-gray-900" />
          </div>
        )}
        <span className="truncate max-w-[200px]">{feedback.text}</span>
      </div>
    </div>
  );
};

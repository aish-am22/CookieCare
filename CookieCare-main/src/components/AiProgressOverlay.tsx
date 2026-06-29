/**
 * AiProgressOverlay
 *
 * A shared, reusable full-pane overlay used by every AI feature to show
 * meaningful SSE progress while the backend processes a job.
 *
 * Usage:
 *   <AiProgressOverlay
 *     visible={isLoading}
 *     message={progressMessage}
 *     error={errorMessage}
 *     onRetry={handleRetry}           // optional – shows Retry button on error
 *     onDismiss={() => setError("")}  // optional – shows Dismiss on error
 *     label="Analyzing document..."   // short label shown above message
 *   />
 *
 * The overlay is absolutely positioned so it must be inside a `relative`
 * parent.  All existing loaders remain untouched; this component is only
 * added alongside them.
 */

import React from "react";
import { Sparkles, Loader2, AlertTriangle, RefreshCw, X } from "lucide-react";

// Ordered sequence of generic progress messages that cycle while waiting.
// Individual features also pass their own real-time `message` prop which
// supersedes these when available.
const PROGRESS_STEPS = [
  "Preparing request...",
  "Uploading document...",
  "Reading document...",
  "Extracting text...",
  "Processing input...",
  "Preparing AI request...",
  "Sending request to AI...",
  "Analyzing...",
  "Validating output...",
  "Generating response...",
  "Formatting results...",
  "Finalizing...",
];

interface AiProgressOverlayProps {
  /** Show/hide the overlay */
  visible: boolean;
  /** Real-time message from SSE job updates — shown in place of the cycling steps */
  message?: string;
  /** Error string — switches overlay into error state */
  error?: string;
  /** Short label shown above the main message */
  label?: string;
  /** Called when the user clicks Retry */
  onRetry?: () => void;
  /** Called when the user clicks Dismiss on an error */
  onDismiss?: () => void;
}

export default function AiProgressOverlay({
  visible,
  message,
  error,
  label = "AI Processing",
  onRetry,
  onDismiss,
}: AiProgressOverlayProps) {
  const [stepIndex, setStepIndex] = React.useState(0);

  // Cycle through generic progress steps every 1.8 s when no real message is
  // provided and there is no error.
  React.useEffect(() => {
    if (!visible || error) return;
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % PROGRESS_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [visible, error]);

  if (!visible) return null;

  const displayMessage = error
    ? error
    : message && message.trim()
    ? message
    : PROGRESS_STEPS[stepIndex];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50/96 backdrop-blur-[2px] p-6 select-none">
      <div className="max-w-sm w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center space-y-5 relative overflow-hidden">

        {/* Top accent bar */}
        {!error && (
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 animate-pulse" />
        )}
        {error && (
          <div className="absolute inset-x-0 top-0 h-[3px] bg-rose-500" />
        )}

        {/* Icon */}
        <div className="flex justify-center">
          {error ? (
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
          ) : (
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-gray-100 border-t-black animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Label + message */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-widest text-gray-400 font-bold uppercase">
            {error ? "Processing Error" : label}
          </p>

          <p
            className={`text-sm font-medium leading-snug transition-all duration-300 ${
              error ? "text-rose-700 font-semibold" : "text-gray-800"
            }`}
          >
            {displayMessage}
          </p>
        </div>

        {/* Pulsing dots — only shown when processing */}
        {!error && (
          <div className="flex justify-center space-x-1.5 pt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}

        {/* Action buttons on error */}
        {error && (
          <div className="flex items-center justify-center gap-3 pt-2">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Dismiss
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-mono font-bold hover:bg-gray-800 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Processing footer */}
        {!error && (
          <div className="pt-1 flex items-center justify-center space-x-2 text-[10px] font-mono text-gray-400">
            <Loader2 className="w-3 h-3 animate-spin text-black" />
            <span>SECURE AI ENGINE • DO NOT CLOSE</span>
          </div>
        )}
      </div>
    </div>
  );
}

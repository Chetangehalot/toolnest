import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info', // 'warning', 'danger', 'success', 'info'
  isLoading = false
}) => {
  const typeConfig = {
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-amber-300',
      iconBg: 'bg-amber-500/10',
      confirmBg: 'bg-amber-600/80 hover:bg-amber-600',
      borderColor: 'border-amber-500/20'
    },
    danger: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-rose-300',
      iconBg: 'bg-rose-500/10',
      confirmBg: 'bg-rose-600/80 hover:bg-rose-600',
      borderColor: 'border-rose-500/20'
    },
    success: {
      icon: CheckCircleIcon,
      iconColor: 'text-emerald-300',
      iconBg: 'bg-emerald-500/10',
      confirmBg: 'bg-emerald-600/80 hover:bg-emerald-600',
      borderColor: 'border-emerald-500/20'
    },
    info: {
      icon: InformationCircleIcon,
      iconColor: 'text-sky-300',
      iconBg: 'bg-sky-500/10',
      confirmBg: 'bg-sky-600/80 hover:bg-sky-600',
      borderColor: 'border-sky-500/20'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0A0F24]/95 border border-[#00FFE0]/15 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl backdrop-blur-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center border ${config.borderColor}`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-[#F5F5F5]">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#CFCFCF] hover:text-[#F5F5F5] transition-colors p-1 rounded-lg hover:bg-[#00FFE0]/10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Message */}
          <p className="text-[#CFCFCF] mb-6 leading-relaxed text-sm">{message}</p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-[#0A0F24]/40 border border-[#00FFE0]/15 text-[#F5F5F5] rounded-lg hover:border-[#00FFE0]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm ${config.confirmBg}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-xs">Loading...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal; 

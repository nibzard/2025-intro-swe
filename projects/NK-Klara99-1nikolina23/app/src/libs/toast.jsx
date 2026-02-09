import { useState, createContext, useContext, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts }) {
  if (toasts.length === 0) return null;

  const typeStyles = {
    success: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      icon: "✓",
    },
    error: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      icon: "✕",
    },
    warning: {
      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      icon: "⚠",
    },
    info: {
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      icon: "ℹ",
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: "14px 20px",
            borderRadius: 12,
            color: "white",
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            maxWidth: 400,
            animation: "slideIn 0.3s ease",
            ...typeStyles[toast.type],
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {typeStyles[toast.type].icon}
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

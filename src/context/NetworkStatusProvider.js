"use client";
import { createContext, useContext, useEffect, useState } from "react";

const NetworkStatusContext = createContext();

export function NetworkStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineBanner(true);
      setTimeout(() => setShowOnlineBanner(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineBanner(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline }}>
      {/* Global banners */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-700 text-white text-center py-2 z-50">
          You are offline. Please check your internet connection.
        </div>
      )}
      {showOnlineBanner && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white text-center py-2 z-50 transition-opacity duration-500">
          Back online
        </div>
      )}

      {children}
    </NetworkStatusContext.Provider>
  );
}

export const useNetworkStatus = () => useContext(NetworkStatusContext);

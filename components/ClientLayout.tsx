"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "vaimo:commentPanelCollapsed";

interface CommentPanelCtx {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const CommentPanelContext = createContext<CommentPanelCtx>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useCommentPanel() {
  return useContext(CommentPanelContext);
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  // Sync from localStorage once on mount (previous session)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsedState(stored === "true");
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    localStorage.setItem(STORAGE_KEY, String(v));
  }, []);

  return (
    <CommentPanelContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </CommentPanelContext.Provider>
  );
}

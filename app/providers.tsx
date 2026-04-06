"use client";

import { Provider } from "../lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

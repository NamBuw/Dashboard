"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";
import { ProductProvider } from "./ProductProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ProductProvider>{children}</ProductProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | Paavti",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

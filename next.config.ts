import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pinned so Turbopack doesn't infer a workspace root from a stray lockfile
  // higher up the tree. Derived from this file's own location rather than
  // hardcoded — an absolute path here broke when the folder was moved.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;

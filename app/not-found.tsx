"use client";

import Link from "next/link";
import Image from "next/image";

import notFoundImage from "@/assets/error-404-not-found.png";

export default function NotFound() {
  return (
    <main className="mx-auto flex flex-col items-center justify-center py-20 text-center">
      <Image
        src={notFoundImage}
        alt="404 Not Found"
        className="mx-auto mb-6 h-56 w-auto"
      />
      <h1 className="mb-2 text-5xl font-bold text-ink sm:text-6xl">Not Found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink/60">
        Page not found. The URL may be incorrect, moved, or deleted.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink/5"
      >
        Back to Home
      </Link>
    </main>
  );
}

import Link from "next/link";

/** Placeholder for planner pages that live on their own feature branch. */
export const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
    <p className="font-medium">{title} is on its way.</p>
    <Link
      href="/"
      className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white"
    >
      Back to the map
    </Link>
  </div>
);

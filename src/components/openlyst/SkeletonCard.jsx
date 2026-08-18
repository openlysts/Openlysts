export default function SkeletonCard() {
  return (
    <div className="card p-4 h-[210px] animate-pulse flex flex-col" aria-hidden="true">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-bg-subtle" />
          <div className="space-y-1.5">
            <div className="w-24 h-4 bg-bg-subtle rounded" />
            <div className="w-16 h-3 bg-bg-subtle rounded" />
          </div>
        </div>
        <div className="w-6 h-6 rounded bg-bg-subtle" />
      </div>
      <div className="space-y-2 mt-2">
        <div className="w-full h-3 bg-bg-subtle rounded" />
        <div className="w-5/6 h-3 bg-bg-subtle rounded" />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <div className="w-16 h-4 bg-bg-subtle rounded" />
        <div className="flex gap-2">
          <div className="w-12 h-4 bg-bg-subtle rounded" />
          <div className="w-12 h-4 bg-bg-subtle rounded" />
        </div>
      </div>
    </div>
  );
}

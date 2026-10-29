export default function Loading() {
  return (
    <div role="status" aria-label="Carregando" className="animate-pulse space-y-4">
      <div className="h-9 w-48 rounded-md bg-a-line/70" />
      <div className="h-40 rounded-lg bg-a-line/50" />
      <div className="h-64 rounded-lg bg-a-line/40" />
    </div>
  );
}

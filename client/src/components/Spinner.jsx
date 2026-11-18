export default function Spinner() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  );
}

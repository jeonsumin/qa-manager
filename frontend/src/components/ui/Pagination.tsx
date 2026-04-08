interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm rounded border disabled:opacity-40 hover:bg-gray-50">이전</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)} className={`px-3 py-1 text-sm rounded border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>{p}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="px-3 py-1 text-sm rounded border disabled:opacity-40 hover:bg-gray-50">다음</button>
    </div>
  );
}

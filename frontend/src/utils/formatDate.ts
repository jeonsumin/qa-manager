export function formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('ko-KR', {year: 'numeric', month: '2-digit', day: '2-digit'});
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

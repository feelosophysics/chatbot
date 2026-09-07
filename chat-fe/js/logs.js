/**
 * Logs & Audit Center Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    setupNavbar(true);
    fetchLogs();
});

async function fetchLogs() {
    const statusFilter = document.getElementById('statusFilter').value;
    const tbody = document.getElementById('logsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-12 text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-1"></i> 로그를 불러오는 중...</td></tr>';

    try {
        let endpoint = '/api/v1/logs?limit=100';
        if (statusFilter) endpoint += `&status=${statusFilter}`;

        const res = await apiRequest(endpoint);
        if (!res.ok) throw new Error('로그 조회 실패');
        
        const data = await res.json();
        const items = data.items || [];

        // Update stats
        document.getElementById('statTotalLogs').innerText = `${items.length}건`;
        
        let totalLatency = 0;
        let aiCount = 0;
        let successCount = 0;

        items.forEach(item => {
            if (item.role === 'assistant') {
                aiCount++;
                totalLatency += (item.latency_ms || 0);
                if (item.status === 'success') successCount++;
            }
        });

        const avgLat = aiCount > 0 ? Math.round(totalLatency / aiCount) : 0;
        document.getElementById('statAvgLatency').innerText = `${avgLat} ms`;

        const successRate = aiCount > 0 ? Math.round((successCount / aiCount) * 100) : 100;
        document.getElementById('statSuccessRate').innerText = `${successRate}%`;

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-12 text-slate-500">기록된 대화 로그가 없습니다.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => {
            const dateStr = new Date(item.created_at).toLocaleString('ko-KR', {
                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            const roleBadge = item.role === 'user' 
                ? '<span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold">USER</span>'
                : '<span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-semibold">AI BOT</span>';

            const statusBadge = item.status === 'success'
                ? '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">성공</span>'
                : '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400">오류</span>';

            // Escaped snippet preview
            const contentPreview = item.content.length > 80 
                ? item.content.substring(0, 80) + '...'
                : item.content;

            return `
                <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3 px-4 text-slate-500">#${item.id}</td>
                    <td class="py-3 px-4 text-slate-400 whitespace-nowrap">${dateStr}</td>
                    <td class="py-3 px-4 font-sans text-slate-200 font-medium">${escapeHtml(item.username)}</td>
                    <td class="py-3 px-4 text-slate-400">#${item.session_id}</td>
                    <td class="py-3 px-4">${roleBadge}</td>
                    <td class="py-3 px-4 font-sans text-slate-300 max-w-xs sm:max-w-md truncate" title="${escapeHtml(item.content)}">
                        ${escapeHtml(contentPreview)}
                    </td>
                    <td class="py-3 px-4 text-right text-slate-400">${item.latency_ms ? item.latency_ms + 'ms' : '-'}</td>
                    <td class="py-3 px-4 text-center">${statusBadge}</td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-red-400">로그 로딩 오류: ${err.message}</td></tr>`;
    }
}

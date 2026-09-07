/**
 * AI Learning Tutor Chatbot - Frontend Client Logic
 * Handles SSE Streaming, Session Management, Markdown Rendering, and Code Highlighting.
 */

let currentSessionId = null;
let isStreaming = false;

// Configure Marked.js with Highlight.js
if (typeof marked !== 'undefined') {
    marked.setOptions({
        highlight: function(code, lang) {
            if (typeof hljs !== 'undefined') {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {}
                }
                try {
                    return hljs.highlightAuto(code).value;
                } catch (err) {}
            }
            return code;
        },
        breaks: true,
        gfm: true
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    setupNavbar(true);
    loadSessions();
    const input = document.getElementById('chatInput');
    if (input) {
        input.focus();
    }
});

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    
    // Update char counter
    const counter = document.getElementById('charCounter');
    if (counter) {
        counter.innerText = `${textarea.value.length}/2000`;
    }
}

// Handle Enter key (Shift+Enter for newline)
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        document.getElementById('chatForm').dispatchEvent(new Event('submit'));
    }
}

// Quick Prompt Sender
function sendQuickPrompt(promptText) {
    const input = document.getElementById('chatInput');
    input.value = promptText;
    autoResizeTextarea(input);
    document.getElementById('chatForm').dispatchEvent(new Event('submit'));
}

// ----------------------------------------------------
// Session Management
// ----------------------------------------------------

async function loadSessions() {
    const listEl = document.getElementById('sessionsList');
    if (!listEl) return;

    try {
        const res = await apiRequest('/api/v1/chat/sessions');
        if (!res.ok) throw new Error('세션 목록 조회 실패');
        
        const sessions = await res.json();
        listEl.innerHTML = '';

        if (sessions.length === 0) {
            listEl.innerHTML = '<div class="text-center py-6 text-slate-500 text-xs">생성된 대화가 없습니다.</div>';
            return;
        }

        sessions.forEach(session => {
            const item = document.createElement('div');
            const isActive = currentSessionId === session.id;
            item.className = `group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-xs ${
                isActive ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30' : 'hover:bg-slate-800 text-slate-300'
            }`;
            item.onclick = () => selectSession(session.id, session.title);

            item.innerHTML = `
                <div class="flex items-center space-x-2.5 truncate flex-1 mr-2">
                    <i class="fa-regular fa-message flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}"></i>
                    <span class="truncate">${escapeHtml(session.title)}</span>
                </div>
                <button onclick="event.stopPropagation(); deleteSession(${session.id})" 
                        title="대화 삭제" 
                        class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition flex-shrink-0">
                    <i class="fa-solid fa-trash-can text-[11px]"></i>
                </button>
            `;
            listEl.appendChild(item);
        });

    } catch (err) {
        listEl.innerHTML = `<div class="text-center py-6 text-red-400 text-xs">오류: ${err.message}</div>`;
    }
}

async function selectSession(sessionId, title) {
    if (isStreaming) return;
    currentSessionId = sessionId;
    document.getElementById('currentSessionBadge').innerText = `#${sessionId}`;
    document.getElementById('currentSessionTitle').innerText = title || '대화방';

    // Hide welcome hero
    const welcomeHero = document.getElementById('welcomeHero');
    if (welcomeHero) welcomeHero.classList.add('hidden');

    // Reload sidebar highlight
    loadSessions();

    // Fetch messages
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '<div class="text-center py-12 text-slate-500 text-sm"><i class="fa-solid fa-spinner fa-spin mr-1"></i> 대화 내역 불러오는 중...</div>';

    try {
        const res = await apiRequest(`/api/v1/chat/sessions/${sessionId}/messages`);
        if (!res.ok) throw new Error('대화 내역 조회 실패');
        
        const messages = await res.json();
        container.innerHTML = '';

        if (messages.length === 0) {
            if (welcomeHero) {
                welcomeHero.classList.remove('hidden');
                container.appendChild(welcomeHero);
            }
            return;
        }

        messages.forEach(msg => {
            appendMessageBubble(msg.role, msg.content, {
                latency_ms: msg.latency_ms,
                status: msg.status,
                created_at: msg.created_at
            });
        });

        scrollToBottom();

    } catch (err) {
        container.innerHTML = `<div class="text-center py-12 text-red-400 text-sm">오류: ${err.message}</div>`;
    }
}

function createNewSession() {
    if (isStreaming) return;
    currentSessionId = null;
    document.getElementById('currentSessionBadge').innerText = '새 세션';
    document.getElementById('currentSessionTitle').innerText = '새로운 대화';
    
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    const welcomeHero = document.getElementById('welcomeHero');
    if (welcomeHero) {
        welcomeHero.classList.remove('hidden');
        container.appendChild(welcomeHero);
    }
    
    loadSessions();
    document.getElementById('chatInput').focus();
}

async function deleteSession(sessionId) {
    if (!confirm('이 대화 세션과 모든 메시지를 삭제하시겠습니까?')) return;
    try {
        const res = await apiRequest(`/api/v1/chat/sessions/${sessionId}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('대화가 삭제되었습니다.', 'info');
            if (currentSessionId === sessionId) {
                createNewSession();
            } else {
                loadSessions();
            }
        }
    } catch (err) {
        showToast('삭제 실패', 'error');
    }
}

function clearCurrentChatView() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    const welcomeHero = document.getElementById('welcomeHero');
    if (welcomeHero) {
        welcomeHero.classList.remove('hidden');
        container.appendChild(welcomeHero);
    }
}

// ----------------------------------------------------
// Streaming Chat Execution (SSE)
// ----------------------------------------------------

async function handleChatSubmit(e) {
    e.preventDefault();
    if (isStreaming) return;

    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    // Reset input
    input.value = '';
    autoResizeTextarea(input);

    // Hide error banner & welcome hero
    document.getElementById('errorBanner').classList.add('hidden');
    const welcomeHero = document.getElementById('welcomeHero');
    if (welcomeHero) welcomeHero.classList.add('hidden');

    // Append User Message Bubble
    appendMessageBubble('user', message);
    scrollToBottom();

    // Create Assistant Placeholder Bubble for Streaming
    const assistantBubbleId = 'ai-stream-' + Date.now();
    const assistantBubble = appendAssistantStreamingBubble(assistantBubbleId);
    scrollToBottom();

    // UI state: streaming mode
    setStreamingState(true);

    try {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/chat/stream`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                message: message,
                session_id: currentSessionId
            })
        });

        if (response.status === 401) {
            removeToken();
            window.location.href = 'login.html';
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }

        if (!response.ok) {
            throw new Error(`서버 응답 오류 (HTTP ${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullAssistantText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // keep partial chunk

            for (const block of lines) {
                if (!block.trim()) continue;

                let eventType = 'message';
                let dataStr = '';

                const blockLines = block.split('\n');
                for (const line of blockLines) {
                    if (line.startsWith('event:')) {
                        eventType = line.replace('event:', '').trim();
                    } else if (line.startsWith('data:')) {
                        dataStr = line.replace('data:', '').trim();
                    }
                }

                if (!dataStr) continue;

                try {
                    const parsed = JSON.parse(dataStr);

                    if (eventType === 'meta') {
                        // First event with session information
                        if (!currentSessionId) {
                            currentSessionId = parsed.session_id;
                            document.getElementById('currentSessionBadge').innerText = `#${parsed.session_id}`;
                            document.getElementById('currentSessionTitle').innerText = parsed.session_title;
                            loadSessions();
                        }
                    } else if (eventType === 'done') {
                        // Final event
                        finishStreamingBubble(assistantBubbleId, fullAssistantText, parsed.latency_ms, parsed.status);
                    } else if (eventType === 'error') {
                        showErrorBanner(parsed.message || '오류가 발생했습니다.');
                    } else {
                        // Regular token streaming chunk
                        if (parsed.text) {
                            fullAssistantText += parsed.text;
                            updateStreamingBubbleText(assistantBubbleId, fullAssistantText);
                            scrollToBottom();
                        }
                    }
                } catch (parseErr) {
                    console.error('SSE JSON parse error:', parseErr, dataStr);
                }
            }
        }

    } catch (err) {
        console.error(err);
        showErrorBanner(err.message || '네트워크 오류가 발생했습니다.');
        updateStreamingBubbleText(assistantBubbleId, `\n\n⚠️ **요청 처리 중 오류가 발생했습니다: ${err.message}**`);
    } finally {
        setStreamingState(false);
        input.focus();
    }
}

// ----------------------------------------------------
// Bubble Rendering Helpers
// ----------------------------------------------------

function appendMessageBubble(role, content, meta = {}) {
    const container = document.getElementById('messagesContainer');
    const msgDiv = document.createElement('div');

    if (role === 'user') {
        msgDiv.className = 'flex justify-end items-start space-x-3 max-w-4xl mx-auto';
        msgDiv.innerHTML = `
            <div class="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md max-w-2xl text-sm leading-relaxed whitespace-pre-wrap font-sans">
                ${escapeHtml(content)}
            </div>
            <div class="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                <i class="fa-solid fa-user"></i>
            </div>
        `;
    } else {
        msgDiv.className = 'flex items-start space-x-3 max-w-4xl mx-auto';
        const renderedHtml = marked.parse(content);
        const latencyText = meta.latency_ms ? `${meta.latency_ms}ms` : '';

        msgDiv.innerHTML = `
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-indigo-500/20">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-md max-w-3xl flex-1 text-slate-200">
                <div class="markdown-body font-sans">
                    ${renderedHtml}
                </div>
                ${latencyText ? `
                    <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span><i class="fa-regular fa-clock mr-1"></i>응답 속도: ${latencyText}</span>
                        <button onclick="copyMessageText(this)" class="hover:text-indigo-400 transition" title="텍스트 복사">
                            <i class="fa-regular fa-copy"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    container.appendChild(msgDiv);
}

function appendAssistantStreamingBubble(id) {
    const container = document.getElementById('messagesContainer');
    const msgDiv = document.createElement('div');
    msgDiv.id = id;
    msgDiv.className = 'flex items-start space-x-3 max-w-4xl mx-auto';

    msgDiv.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md shadow-indigo-500/20 animate-pulse">
            <i class="fa-solid fa-robot"></i>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-md max-w-3xl flex-1 text-slate-200">
            <div class="markdown-body font-sans content-area typing-cursor">
                <p class="text-slate-400 italic">생각하는 중...</p>
            </div>
            <div class="meta-footer hidden mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span class="latency-label"></span>
                <button onclick="copyMessageText(this)" class="hover:text-indigo-400 transition" title="텍스트 복사">
                    <i class="fa-regular fa-copy"></i>
                </button>
            </div>
        </div>
    `;
    container.appendChild(msgDiv);
    return msgDiv;
}

function updateStreamingBubbleText(id, text) {
    const bubble = document.getElementById(id);
    if (!bubble) return;
    const contentArea = bubble.querySelector('.content-area');
    if (contentArea) {
        contentArea.innerHTML = marked.parse(text);
        contentArea.classList.add('typing-cursor');
    }
}

function finishStreamingBubble(id, fullText, latencyMs, status) {
    const bubble = document.getElementById(id);
    if (!bubble) return;
    
    // Stop avatar animation & typing cursor
    const avatar = bubble.querySelector('.animate-pulse');
    if (avatar) avatar.classList.remove('animate-pulse');

    const contentArea = bubble.querySelector('.content-area');
    if (contentArea) {
        contentArea.classList.remove('typing-cursor');
        contentArea.innerHTML = marked.parse(fullText);
    }

    const metaFooter = bubble.querySelector('.meta-footer');
    if (metaFooter && latencyMs) {
        metaFooter.classList.remove('hidden');
        metaFooter.querySelector('.latency-label').innerHTML = `<i class="fa-regular fa-clock mr-1"></i>응답 속도: ${latencyMs}ms`;
    }
}

function setStreamingState(streaming) {
    isStreaming = streaming;
    const btn = document.getElementById('sendBtn');
    const input = document.getElementById('chatInput');
    if (streaming) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i>';
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i>';
    }
}

function showErrorBanner(msg) {
    const banner = document.getElementById('errorBanner');
    const text = document.getElementById('errorBannerText');
    text.innerText = msg;
    banner.classList.remove('hidden');
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function copyMessageText(btn) {
    const bubble = btn.closest('.bg-slate-900');
    const contentArea = bubble.querySelector('.markdown-body');
    if (contentArea) {
        navigator.clipboard.writeText(contentArea.innerText).then(() => {
            showToast('답변 텍스트가 복사되었습니다.', 'success');
        });
    }
}

/**
 * API & Authentication Helper Utilities
 */

const TOKEN_KEY = 'chat_access_token';
const USER_KEY = 'chat_user_info';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token, user) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function getUser() {
    try {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
    } catch {
        return null;
    }
}

/**
 * Standard API request wrapper with Bearer token authentication
 */
async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            // Unauthorized
            removeToken();
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
                window.location.href = 'login.html';
            }
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }

        return response;
    } catch (err) {
        console.error('API Request error:', err);
        throw err;
    }
}

/**
 * Global Toast Notification
 */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-red-500/90 border-red-400' :
                    type === 'success' ? 'bg-emerald-500/90 border-emerald-400' :
                    'bg-slate-800/90 border-slate-700';
    const icon = type === 'error' ? 'fa-circle-exclamation' :
                 type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    
    toast.className = `pointer-events-auto flex items-center space-x-2 px-4 py-3 rounded-xl border text-white shadow-xl backdrop-blur transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span class="text-sm font-medium">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/**
 * Header & Auth State Initializer
 */
function setupNavbar(requireAuth = true) {
    const token = getToken();
    const user = getUser();

    if (requireAuth && !token) {
        window.location.href = 'login.html';
        return;
    }

    const authNav = document.getElementById('authNav');
    if (authNav) {
        if (token && user) {
            authNav.innerHTML = `
                <a href="index.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-1.5">
                    <i class="fa-solid fa-comments"></i>
                    <span>채팅</span>
                </a>
                <a href="logs.html" class="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-1.5">
                    <i class="fa-solid fa-database"></i>
                    <span>대화 로그</span>
                </a>
                <div class="h-4 w-px bg-slate-800"></div>
                <div class="flex items-center space-x-2 text-slate-400">
                    <i class="fa-solid fa-user-circle text-indigo-400"></i>
                    <span class="font-medium text-slate-200">${escapeHtml(user.username)}</span>
                </div>
                <button onclick="handleLogout()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition flex items-center space-x-1">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>로그아웃</span>
                </button>
            `;
        } else {
            authNav.innerHTML = `
                <a href="login.html" class="px-4 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition">
                    로그인
                </a>
                <a href="register.html" class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition">
                    회원가입
                </a>
            `;
        }
    }
}

async function handleLogout() {
    try {
        await apiRequest('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
        console.warn('Logout request ignored or failed:', e);
    } finally {
        removeToken();
        showToast('로그아웃되었습니다.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 300);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

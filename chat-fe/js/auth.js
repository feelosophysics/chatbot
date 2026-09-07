/**
 * Authentication Form Handlers (Login / Register)
 */

async function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errBox = document.getElementById('errorMessage');
    const errText = document.getElementById('errorText');
    const submitBtn = document.getElementById('submitBtn');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    errBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>로그인 중...</span>';

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            setToken(data.access_token, data.user);
            showToast(`${data.user.username}님 환영합니다!`, 'success');
            
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || 'index.html';
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        } else {
            errText.innerText = data.detail || '로그인에 실패했습니다.';
            errBox.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>로그인</span><i class="fa-solid fa-arrow-right"></i>';
        }
    } catch (err) {
        errText.innerText = `서버 연결 실패 (${CONFIG.API_BASE_URL}). 백엔드 서버가 실행 중인지 확인하세요.`;
        errBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>로그인</span><i class="fa-solid fa-arrow-right"></i>';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const errBox = document.getElementById('errorMessage');
    const errText = document.getElementById('errorText');
    const submitBtn = document.getElementById('submitBtn');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    if (password !== passwordConfirm) {
        errText.innerText = '비밀번호와 비밀번호 확인이 일치하지 않습니다.';
        errBox.classList.remove('hidden');
        return;
    }

    errBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>가입 처리 중...</span>';

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 800);
        } else {
            errText.innerText = data.detail || '회원가입에 실패했습니다.';
            errBox.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>계정 생성하기</span><i class="fa-solid fa-user-check"></i>';
        }
    } catch (err) {
        errText.innerText = `서버 연결 실패 (${CONFIG.API_BASE_URL}). 백엔드 서버가 실행 중인지 확인하세요.`;
        errBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>계정 생성하기</span><i class="fa-solid fa-user-check"></i>';
    }
}

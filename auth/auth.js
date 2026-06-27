const STORAGE = {
    CLIENT_ID: 'netatmo_client_id',
    CLIENT_SECRET: 'netatmo_client_secret',
    REDIRECT_URI: 'netatmo_redirect_uri',
    SCOPE: 'netatmo_scope',
    CODE_VERIFIER: 'netatmo_code_verifier',
    STATE: 'netatmo_state',
    TOKEN: 'netatmo_token'
};

const AUTH_API = {
    AUTH: 'https://api.netatmo.com/oauth2/authorize',
    TOKEN: 'https://api.netatmo.com/oauth2/token'
};

export const DEFAULT_SCOPE = 'read_thermostat write_thermostat read_magellan write_magellan';

export const ALL_SCOPES = 'read_station write_station read_thermostat write_thermostat read_camera write_camera access_camera read_presence write_presence access_presence read_homecoach write_homecoach read_magellan write_magellan read_bubendorff write_bubendorff read_smokedetector write_smokedetector read_doorbell write_doorbell access_doorbell read_smarther write_smarther read_carbonmonoxidedetector write_carbonmonoxidedetector read_doorlock write_doorlock read_clim write_clim read_mx write_mx access_mx read_camerapro write_camerapro access_camerapro read_mhs1 write_mhs1 read_hybrid write_hybrid read_phnx write_phnx access_phnx read_bfi write_bfi access_bfi read_c100x write_c100x access_c100x read_bdiy write_bdiy access_bdiy read_boreal write_boreal read_cep write_cep access_cep read_ntg write_ntg read_c300x write_c300x access_c300x';

let authCallbacks = {};

export function configureAuth(callbacks = {}) {
    authCallbacks = callbacks;
}

export function showAuthError(message) {
    const el = document.getElementById('auth-error');
    el.textContent = message;
    el.classList.remove('hidden');
}

function showConfigStatus(message, type = 'error') {
    const el = document.getElementById('config-status');
    el.textContent = message;
    el.className = type === 'success' ? 'success' : 'error';
    if (type === 'success') {
        setTimeout(() => {
            el.textContent = '';
            el.className = ''
        }, 3000);
    }
}

export function loadConfig() {
    const clientId = localStorage.getItem(STORAGE.CLIENT_ID) || '';
    const clientSecret = localStorage.getItem(STORAGE.CLIENT_SECRET) || '';
    const redirectUri = localStorage.getItem(STORAGE.REDIRECT_URI) || 'https://ctamisier.github.io/monatmo/';
    const scope = localStorage.getItem(STORAGE.SCOPE) || DEFAULT_SCOPE;

    document.getElementById('clientId').value = clientId;
    document.getElementById('clientSecret').value = clientSecret;
    document.getElementById('redirectUri').value = redirectUri;
    document.getElementById('scope').value = scope;

    document.getElementById('auth-button').disabled = !clientId;
}

export function saveConfig() {
    const clientId = document.getElementById('clientId').value.trim();
    const clientSecret = document.getElementById('clientSecret').value.trim();
    const redirectUri = document.getElementById('redirectUri').value.trim();
    const scope = document.getElementById('scope').value.trim();

    if (!clientId) {
        showAuthError('Veuillez entrer un Client ID.');
        return;
    }

    localStorage.setItem(STORAGE.CLIENT_ID, clientId);
    localStorage.setItem(STORAGE.CLIENT_SECRET, clientSecret);
    localStorage.setItem(STORAGE.REDIRECT_URI, redirectUri);
    localStorage.setItem(STORAGE.SCOPE, scope);

    document.getElementById('auth-button').disabled = false;
    showConfigStatus('Configuration enregistrée !', 'success');
}

export function clearLocalStorage() {
    if (!confirm('Êtes-vous sûr de vouloir tout supprimer ?\n\nCela effacera :\n- Client ID / Secret\n- Redirect URI\n- Scopes\n- Token d\'accès\n- Toutes les préférences\n\nVous devrez vous reconnecter.')) {
        return;
    }

    localStorage.removeItem(STORAGE.CLIENT_ID);
    localStorage.removeItem(STORAGE.CLIENT_SECRET);
    localStorage.removeItem(STORAGE.REDIRECT_URI);
    localStorage.removeItem(STORAGE.SCOPE);
    localStorage.removeItem(STORAGE.TOKEN);

    sessionStorage.removeItem(STORAGE.CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE.STATE);

    document.getElementById('clientId').value = '';
    document.getElementById('clientSecret').value = '';
    document.getElementById('redirectUri').value = '';
    document.getElementById('scope').value = DEFAULT_SCOPE;

    document.getElementById('auth-button').disabled = true;
    document.getElementById('auth-card').classList.remove('hidden');
    document.getElementById('token-card').classList.add('hidden');

    authCallbacks.onStorageCleared?.();

    showConfigStatus('LocalStorage nettoyé ! Vous pouvez reconfigurer.', 'success');
}

function generateCodeVerifier() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateState() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

export async function startAuth() {
    const clientId = localStorage.getItem(STORAGE.CLIENT_ID);
    const redirectUri = localStorage.getItem(STORAGE.REDIRECT_URI);
    const scope = localStorage.getItem(STORAGE.SCOPE);

    if (!clientId) {
        showAuthError('Client ID manquant. Veuillez configurer l\'application.');
        return;
    }

    try {
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateState();

        sessionStorage.setItem(STORAGE.CODE_VERIFIER, codeVerifier);
        sessionStorage.setItem(STORAGE.STATE, state);

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            scope: scope,
            state: state
        });

        window.location.href = `${AUTH_API.AUTH}?${params.toString()}`;
    } catch (error) {
        showAuthError(`Erreur : ${error.message}`);
    }
}

async function exchangeCodeForToken(code) {
    const clientId = localStorage.getItem(STORAGE.CLIENT_ID);
    const clientSecret = localStorage.getItem(STORAGE.CLIENT_SECRET);
    const redirectUri = localStorage.getItem(STORAGE.REDIRECT_URI);
    const codeVerifier = sessionStorage.getItem(STORAGE.CODE_VERIFIER);

    if (codeVerifier) {
        sessionStorage.removeItem(STORAGE.CODE_VERIFIER);
    } else {
        throw new Error('Code verifier introuvable.');
    }

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
    });

    const response = await fetch(AUTH_API.TOKEN, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: params.toString()
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Erreur ${response.status}: ${error.error || 'Inconnu'}`);
    }

    return await response.json();
}

async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDesc = urlParams.get('error_description');
    const state = urlParams.get('state');
    const storedState = sessionStorage.getItem(STORAGE.STATE);

    window.history.replaceState({}, document.title, window.location.pathname);

    if (error) {
        showAuthError(`Erreur OAuth : ${error} - ${errorDesc || 'Aucune description'}`);
        return;
    }

    if (!code) return;

    if (state !== storedState) {
        showAuthError('Erreur de sécurité : state invalide.');
        return;
    }

    try {
        const tokenData = await exchangeCodeForToken(code);
        saveToken(tokenData);
        showTokenInfo(tokenData);
        showConfigStatus('Connexion réussie !', 'success');
    } catch (error) {
        showAuthError(`Échec de l'authentification : ${error.message}`);
    }
}

function saveToken(tokenData) {
    const tokenWithTimestamp = {
        ...tokenData,
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE.TOKEN, JSON.stringify(tokenWithTimestamp));
}

export function getValidToken() {
    const tokenStr = localStorage.getItem(STORAGE.TOKEN);
    if (!tokenStr) return null;

    const token = JSON.parse(tokenStr);
    if (!token.access_token) return null;

    if (token.expires_in) {
        const expiresAt = token.timestamp + (token.expires_in * 1000);
        if (Date.now() > expiresAt) {
            return null;
        }
    }

    return token;
}

function showTokenInfo(token) {
    document.getElementById('access-token').textContent = token.access_token ? '••••••••' : 'N/A';
    document.getElementById('refresh-token').textContent = token.refresh_token ? '••••••••' : 'N/A';
    document.getElementById('expires-in').textContent = token.expires_in || 'N/A';
    document.getElementById('token-scope').textContent = token.scope || 'N/A';

    document.getElementById('auth-card').classList.add('hidden');
    document.getElementById('token-card').classList.remove('hidden');
    document.getElementById('homes-card').classList.remove('hidden');
    document.getElementById('temperature-card').classList.remove('hidden');
    document.getElementById('shutters-card').classList.remove('hidden');
    document.getElementById('lights-card').classList.remove('hidden');

    authCallbacks.onAuthenticated?.(token);
}

function checkAuth() {
    if (getValidToken()) {
        const token = JSON.parse(localStorage.getItem(STORAGE.TOKEN));
        showTokenInfo(token);
    }
}

export function logout() {
    localStorage.removeItem(STORAGE.TOKEN);
    sessionStorage.removeItem(STORAGE.CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE.STATE);

    document.getElementById('auth-card').classList.remove('hidden');
    document.getElementById('token-card').classList.add('hidden');

    authCallbacks.onLogout?.();

    showConfigStatus('Vous êtes déconnecté.', 'success');
}

function bindAuthControls() {
    document.getElementById('save-config-btn')?.addEventListener('click', saveConfig);
    document.getElementById('clear-storage-btn')?.addEventListener('click', clearLocalStorage);
    document.getElementById('auth-button')?.addEventListener('click', startAuth);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
}

export function initAuth(callbacks = {}) {
    configureAuth(callbacks);
    bindAuthControls();
    loadConfig();
    checkAuth();
    handleCallback();
}

export function resetAppOnLogout() {
    document.getElementById('homes-card').classList.add('hidden');
    document.getElementById('temperature-card').classList.add('hidden');
    document.getElementById('shutters-card').classList.add('hidden');
    document.getElementById('lights-card').classList.add('hidden');

    selectedHomeId = null;
    selectedTemperatureRooms = [];
    selectedShutterModule = null;
    selectedShutterBridgeId = null;
    if (temperatureChart) {
        temperatureChart.destroy();
        temperatureChart = null;
    }
}


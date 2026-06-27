import {getValidToken} from "../auth/auth.js";
import {loadTemperatureRooms} from "../temperature/temperature.js";
import {loadShutterModules} from "../shutter/shutter.js";
import {loadLightModules} from "../light/light.js";

window.globalHomesData = [];
window.selectedHomeId = null;
window.homeStatusData = null;

function showHomesError(message) {
    const el = document.getElementById('homes-error');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

export async function loadHomes() {
    const token = getValidToken();
    if (!token) {
        showHomesError('Veuillez vous connecter d\'abord.');
        return;
    }

    try {
        document.getElementById('homes-list').innerHTML = '<div class="loading">Chargement des maisons...</div>';

        const response = await fetch(`${API.BASE}/homesdata`, {
            headers: {'Authorization': `Bearer ${token.access_token}`}
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Erreur ${response.status}: ${error.error?.message || 'Token invalide'}`);
        }

        const data = await response.json();
        globalHomesData = data.body.homes;

        if (!globalHomesData || globalHomesData.length === 0) {
            showHomesError('Aucune maison trouvée.');
            return;
        }

        displayHomes(globalHomesData);

    } catch (error) {
        showHomesError(error.message);
        console.error(error);
    }
}

function displayHomes(homes) {
    const container = document.getElementById('homes-list');
    container.innerHTML = '';

    homes.forEach(home => {
        const homeDiv = document.createElement('div');
        homeDiv.className = 'room-card';
        homeDiv.dataset.homeId = home.id;
        homeDiv.innerHTML = `
                <h4>${home.name || 'Maison sans nom'}</h4>
                <div class="meta">
                    ID: ${home.id}
                </div>
            `;
        homeDiv.onclick = () => selectHome(home.id);
        container.appendChild(homeDiv);
    });

    if (homes.length > 0) {
        selectHome(homes[0].id);
    }
}

async function selectHome(homeId) {
    selectedHomeId = homeId;
    homeStatusData = await fetchHomeStatus();
    if (!homeStatusData) {
        showHomesError('Impossible de charger le statut de la maison.');
        return;
    }

    document.querySelectorAll('#homes-list .room-card').forEach(card => {
        card.classList.remove('selected-home');
        if (card.dataset.homeId === homeId) {
            card.classList.add('selected-home');
        }
    });

    await loadTemperatureRooms(homeStatusData);
    await loadShutterModules(homeStatusData);
    await loadLightModules(homeStatusData);
}

async function fetchHomeStatus() {
    const token = getValidToken();
    if (!token || !selectedHomeId) {
        return null;
    }

    try {
        const response = await fetch(`${API.BASE}/homestatus?home_id=${selectedHomeId}`, {
            headers: {'Authorization': `Bearer ${token.access_token}`}
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error(`Erreur homestatus: ${error.error?.message || 'Inconnu'}`);
            return null;
        }

        const data = await response.json();
        return data.body.home;

    } catch (error) {
        console.error('Erreur lors de la récupération du statut:', error);
        return null;
    }
}
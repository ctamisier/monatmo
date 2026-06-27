import {getValidToken} from "../auth/auth.js";
import {getModuleType} from "../common/common.js";

export function showLightsError(message) {
    const el = document.getElementById('lights-error');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

export async function loadLightModules(homeStatus) {
    const token = getValidToken();
    if (!token) {
        showLightsError('Veuillez vous connecter d\'abord.');
        return;
    }

    if (!selectedHomeId) {
        showLightsError('Veuillez sélectionner une maison d\'abord.');
        return;
    }

    const home = globalHomesData.find(h => h.id === selectedHomeId);
    if (!home) {
        showLightsError('Maison non trouvée.');
        return;
    }

    try {
        document.getElementById('lights-modules-list').innerHTML = '<div class="loading">Chargement des lumières...</div>';
        document.getElementById('lights-modules-section').style.display = 'block';

        if (!homeStatus) {
            throw new Error('Impossible de charger le statut de la maison');
        }

        const lightModules = (home.modules || [])
            .filter(module => getModuleType(module) === 'NLFN')
            .map(module => ({
                ...module,
                status: (homeStatus.modules || []).find(status => status.id === module.id)
            }));

        displayLightModules(lightModules, home.rooms || [], homeStatus.modules || []);
    } catch (error) {
        showLightsError(error.message);
        console.error(error);
    }
}

export function findModuleBridgeId(module, modulesStatus = []) {
    let bridgeId = module.bridge;
    if (!bridgeId && modulesStatus.length > 0) {
        const gatewayModule = modulesStatus.find(m =>
            m.type === 'NLG' || m.type === 'BNS' || m.type === 'BNMH'
        );
        if (gatewayModule) {
            bridgeId = gatewayModule.id;
        }
    }
    if (!bridgeId) {
        const homeData = globalHomesData.find(h => h.id === selectedHomeId);
        if (homeData && homeData.modules) {
            const gatewayModule = homeData.modules.find(m => {
                const type = getModuleType(m);
                return type === 'NLG' || type === 'BNS' || type === 'BNMH';
            });
            if (gatewayModule) {
                bridgeId = gatewayModule.id;
            }
        }
    }
    return bridgeId || '';
}

export async function controlLight(moduleId, bridgeId, on) {
    const token = getValidToken();
    if (!token) {
        showLightsError('Veuillez vous connecter d\'abord.');
        return;
    }

    if (!selectedHomeId) {
        showLightsError('Veuillez sélectionner une maison d\'abord.');
        return;
    }

    const lightCard = document.querySelector(`#lights-modules-list .room-card[data-module-id="${moduleId}"]`);
    const toggleInput = lightCard?.querySelector('.light-toggle-input');
    const stateLabel = lightCard?.querySelector('.light-state');

    if (toggleInput) {
        toggleInput.disabled = true;
    }
    if (lightCard) {
        lightCard.dataset.pending = 'true';
    }

    try {
        const requestBody = {
            home: {
                id: selectedHomeId,
                modules: [
                    {
                        id: moduleId,
                        on: on
                    }
                ]
            }
        };

        if (bridgeId) {
            requestBody.home.modules[0].bridge = bridgeId;
        }

        const response = await fetch(`${API.BASE}/setstate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Erreur ${response.status}: ${error.error?.message || 'Échec de la commande'}`);
        }

        if (stateLabel) {
            stateLabel.textContent = on ? 'Allumé' : 'Éteint';
        }

    } catch (error) {
        if (toggleInput) {
            toggleInput.checked = !on;
        }
        showLightsError(error.message);
        console.error(error);
    } finally {
        if (toggleInput) {
            toggleInput.disabled = false;
        }
        if (lightCard) {
            delete lightCard.dataset.pending;
        }
    }
}

export function getLightStateLabel(status) {
    if (!status || status.on === undefined) {
        return 'État inconnu';
    }

    return status.on ? 'Allumé' : 'Éteint';
}

export function displayLightModules(modules, rooms, modulesStatus = []) {
    const container = document.getElementById('lights-modules-list');
    container.innerHTML = '';

    if (modules.length === 0) {
        container.innerHTML = '<div class="loading">Aucune lumière NLFN trouvée.</div>';
        return;
    }

    modules.forEach(module => {
        const room = rooms.find(r => r.id === module.room_id);
        const roomName = room ? room.name : 'Pièce inconnue';
        const state = getLightStateLabel(module.status);
        const isOn = module.status?.on === true;
        const isControllable = module.status?.on !== undefined;
        const bridgeId = findModuleBridgeId(module, modulesStatus);
        const lightDiv = document.createElement('div');
        lightDiv.className = 'room-card light-card';
        lightDiv.dataset.moduleId = module.id;
        lightDiv.dataset.bridgeId = bridgeId;
        lightDiv.innerHTML = `
                <h4>${module.name || `Lumière ${module.id}`}</h4>
                <div class="meta">
                    Pièce: ${roomName}<br>
                    Type: ${getModuleType(module) || 'inconnu'}<br>
                    ID: ${module.id}
                </div>
                <div class="light-controls">
                    <span class="light-state">${state}</span>
                    <label class="light-toggle">
                        <input type="checkbox" class="light-toggle-input" ${isOn ? 'checked' : ''} ${isControllable ? '' : 'disabled'}>
                        <span class="light-toggle-slider"></span>
                    </label>
                </div>
            `;

        const toggleInput = lightDiv.querySelector('.light-toggle-input');
        const toggleLabel = lightDiv.querySelector('.light-toggle-label');
        const stateElement = lightDiv.querySelector('.light-state');
        toggleInput.addEventListener('change', () => {
            const nextState = toggleInput.checked;
            const stateText = nextState ? 'Allumé' : 'Éteint';
            if (toggleLabel) {
                toggleLabel.textContent = stateText;
            }
            if (stateElement) {
                stateElement.textContent = stateText;
            }
            controlLight(module.id, bridgeId, nextState);
        });

        container.appendChild(lightDiv);
    });
}
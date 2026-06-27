import {getValidToken} from "../auth/auth.js";

window.selectedShutterModule = null;
window.selectedShutterBridgeId = null;

export function showShuttersError(message) {
    const el = document.getElementById('shutters-error');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

export async function loadShutterModules(homeStatus) {
    const token = getValidToken();
    if (!token) {
        showShuttersError('Veuillez vous connecter d\'abord.');
        return;
    }

    if (!selectedHomeId) {
        showShuttersError('Veuillez sélectionner une maison d\'abord.');
        return;
    }

    const home = globalHomesData.find(h => h.id === selectedHomeId);
    if (!home) {
        showShuttersError('Maison non trouvée.');
        return;
    }

    try {
        document.getElementById('shutters-modules-list').innerHTML = '<div class="loading">Chargement des volets...</div>';
        document.getElementById('shutters-modules-section').style.display = 'block';
        document.getElementById('shutters-control-section').style.display = 'none';

        if (!homeStatus) {
            throw new Error('Impossible de charger le statut de la maison');
        }

        const shutterModules = [];
        const shutterTypes = ['NLV', 'NLLV', 'BNAS', 'BNAB', 'BNMS'];

        if (home.modules) {
            home.modules.forEach(module => {
                const moduleType = module.type || module.module_type;
                if (shutterTypes.includes(moduleType)) {
                    const moduleStatus = homeStatus.modules.find(m => m.id === module.id);
                    shutterModules.push({
                        ...module,
                        status: moduleStatus
                    });
                }
            });
        }

        displayShutterModules(shutterModules, homeStatus.modules);

    } catch (error) {
        showShuttersError(error.message);
        console.error(error);
    }
}

export function displayShutterModules(modules, modulesStatus) {
    const container = document.getElementById('shutters-modules-list');
    container.innerHTML = '';

    if (modules.length === 0) {
        container.innerHTML = '<div class="info">Aucun volet roulant trouvé dans cette maison.</div>';
        return;
    }

    const home = globalHomesData.find(h => h.id === selectedHomeId);

    modules.forEach(module => {
        const moduleStatus = modulesStatus.find(m => m.id === module.id);
        const position = moduleStatus?.target_position !== undefined
            ? moduleStatus.target_position
            : moduleStatus?.position !== undefined
                ? moduleStatus.position
                : '--';
        const currentPosition = moduleStatus?.current_position !== undefined
            ? moduleStatus.current_position
            : '--';

        const room = home && home.rooms ? home.rooms.find(r => r.id === module.room_id) : null;
        const roomName = room ? room.name : 'Pièce inconnue';

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
                const gatewayModule = homeData.modules.find(m =>
                    m.type === 'NLG' || m.type === 'BNS' || m.type === 'BNMH'
                );
                if (gatewayModule) {
                    bridgeId = gatewayModule.id;
                }
            }
        }

        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'room-card';
        moduleDiv.dataset.moduleId = module.id;
        moduleDiv.dataset.bridgeId = bridgeId || '';
        moduleDiv.innerHTML = `
                <h4>${module.name || `Volet ${module.id.substring(0, 8)}`}</h4>
                <div class="meta">
                    Pièce: ${roomName}<br>
                    Type: ${module.type || module.module_type || 'inconnu'}<br>
                    ID: ${module.id}<br>
                    Position cible: ${position}%<br>
                    Position actuelle: ${currentPosition}%
                </div>
            `;

        moduleDiv.onclick = () => selectShutterModule(module.id, bridgeId || '', position);
        container.appendChild(moduleDiv);
    });
}

export function selectShutterModule(moduleId, bridgeId, currentPosition) {
    selectedShutterModule = moduleId;
    selectedShutterBridgeId = bridgeId;

    document.querySelectorAll('#shutters-modules-list .room-card').forEach(card => {
        card.classList.remove('selected-shutter');
        if (card.dataset.moduleId === moduleId) {
            card.classList.add('selected-shutter');
        }
    });

    document.getElementById('shutters-modules-section').style.display = 'block';
    document.getElementById('shutters-control-section').style.display = 'block';
    document.getElementById('shutter-position').value = currentPosition !== '--' ? currentPosition : 50;
    document.getElementById('shutter-status').style.display = 'none';
}

window.setShutterPosition = (position) => {
    document.getElementById('shutter-position').value = position;
    controlShutter('position');
}

window.controlShutter = async (action) => {
    const token = getValidToken();
    if (!token) {
        showShuttersError('Veuillez vous connecter d\'abord.');
        return;
    }

    if (!selectedShutterModule || !selectedHomeId) {
        showShuttersError('Veuillez sélectionner un volet d\'abord.');
        return;
    }

    let targetPosition;
    switch (action) {
        case 'open':
            targetPosition = 100;
            break;
        case 'open-soft':
            targetPosition = 98;  // Ouverture sans forçage (évite les taquets)
            break;
        case 'close':
            targetPosition = 0;
            break;
        case 'stop':
            targetPosition = -1;
            break;
        case 'position':
            const input = document.getElementById('shutter-position');
            const value = parseInt(input.value);
            if (isNaN(value) || value < 0 || value > 100) {
                showShuttersError('Veuillez entrer une position valide (0-100).');
                return;
            }
            targetPosition = value;
            break;
        default:
            showShuttersError('Action inconnue.');
            return;
    }

    try {
        const statusEl = document.getElementById('shutter-status');
        statusEl.textContent = 'Envoi de la commande...';
        statusEl.style.display = 'block';
        statusEl.className = 'info';

        const requestBody = {
            home: {
                id: selectedHomeId,
                modules: [
                    {
                        id: selectedShutterModule,
                        target_position: targetPosition
                    }
                ]
            }
        };

        if (selectedShutterBridgeId) {
            requestBody.home.modules[0].bridge = selectedShutterBridgeId;
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

        const data = await response.json();

        const actionText = {
            'open': 'OUVERTURE',
            'open-soft': 'OUVERTURE DOUCE (98%)',
            'close': 'FERMETURE',
            'stop': 'ARRÊT',
            'position': `Position ${targetPosition}%`
        };

        statusEl.textContent = `✓ Commande envoyée : ${actionText[action] || action}`;
        statusEl.className = 'success';

        document.getElementById('shutter-position').value = targetPosition;

        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);

    } catch (error) {
        showShuttersError(error.message);
        const statusEl = document.getElementById('shutter-status');
        statusEl.textContent = `✗ Erreur : ${error.message}`;
        statusEl.className = 'error';
        statusEl.style.display = 'block';
        console.error(error);
    }
}
import {getValidToken} from "../auth/auth.js";
import {getModuleType} from "../common/common.js";

window.temperatureChart = null;
window.selectedTemperatureRooms = [];

function showTemperatureError(message) {
    const el = document.getElementById('temp-error');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 5000);
}

export async function loadTemperatureRooms(homeStatus) {
    const token = getValidToken();
    if (!token) {
        showTemperatureError('Veuillez vous connecter d\'abord.');
        return;
    }

    if (!selectedHomeId) {
        showTemperatureError('Veuillez sélectionner une maison d\'abord.');
        return;
    }

    const home = globalHomesData.find(h => h.id === selectedHomeId);
    if (!home) {
        showTemperatureError('Maison non trouvée.');
        return;
    }

    try {
        document.getElementById('temperature-rooms-list').innerHTML = '<div class="loading">Chargement des pièces...</div>';
        document.getElementById('temperature-rooms-section').style.display = 'block';
        document.getElementById('temperature-chart-section').style.display = 'none';

        if (!homeStatus) {
            throw new Error('Impossible de charger le statut de la maison');
        }

        const roomsWithThermostat = home.rooms.filter(room => {
            const roomStatus = homeStatus.rooms.find(r => r.id === room.id);
            return roomStatus && roomStatus.therm_measured_temperature !== undefined;
        });

        displayTemperatureRooms(roomsWithThermostat, homeStatus.rooms, home.modules || [], homeStatus.modules || []);

    } catch (error) {
        showTemperatureError(error.message);
        console.error(error);
    }
}


export function isValveModule(module) {
    return getModuleType(module) === 'NRV';
}

export function getValveModulesForRoom(roomId, modules, modulesStatus) {
    return modules
        .filter(module => module.room_id === roomId && isValveModule(module))
        .map(module => {
            const moduleStatus = modulesStatus.find(status => status.id === module.id) || {};
            return {
                ...module,
                status: moduleStatus,
                batteryLevel: moduleStatus.battery_level ?? module.battery_level,
                batteryState: moduleStatus.battery_state || module.battery_state || '--'
            };
        });
}

export function renderValveModules(valveModules) {
    if (valveModules.length === 0) {
        return '<div class="valve-empty">Aucun module VALVE dans cette pièce</div>';
    }

    return valveModules.map(module => `
            <div class="valve-module" data-valve-module-id="${module.id}">
                <div>${module.name || `VALVE ${module.id}`}</div>
                <div>Batterie: <span class="valve-battery">${formatBattery(module)}</span></div>
                <div>Type: ${module.type}</div>
            </div>
        `).join('');
}

export function displayTemperatureRooms(rooms, roomsStatus, modules = [], modulesStatus = []) {
    const container = document.getElementById('temperature-rooms-list');
    container.innerHTML = '';

    rooms.forEach(room => {
        const roomStatus = roomsStatus.find(r => r.id === room.id);
        const valveModules = getValveModulesForRoom(room.id, modules, modulesStatus);
        const temp = roomStatus?.therm_measured_temperature ?? '--';
        const setpoint = roomStatus?.therm_setpoint_temperature ?? '--';

        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-card';
        roomDiv.dataset.roomId = room.id;

        roomDiv.innerHTML = `
            <h4>${room.name || `Pièce ${room.id}`}</h4>
            <div class="temp-controls">
                <button onclick="event.stopPropagation(); changeRoomTemperature('${room.id}', -0.5)">-</button>
                <div class="temp">${temp}°C</div>
                <button onclick="event.stopPropagation(); changeRoomTemperature('${room.id}', 0.5)">+</button>
            </div>
            <div class="meta">
                Consigne: <span class="current-setpoint">${setpoint !== '--' ? setpoint + '°C' : '--'}</span><br>
                Type: ${room.type || 'inconnu'}
            </div>
            <div class="valve-modules">
                <strong>Valves</strong>
                ${renderValveModules(valveModules)}
            </div>
        `;

        roomDiv.onclick = () => toggleTemperatureRoomSelection(room.id, roomDiv);
        container.appendChild(roomDiv);
    });
}

export function toggleTemperatureRoomSelection(roomId, element) {
    const index = selectedTemperatureRooms.indexOf(roomId);

    if (index > -1) {
        selectedTemperatureRooms.splice(index, 1);
        element.classList.remove('selected');
    } else {
        selectedTemperatureRooms.push(roomId);
        element.classList.add('selected');
    }
    loadTemperatures()
}

export async function loadTemperatures() {

    if (selectedTemperatureRooms.length === 0) {
        document.getElementById('temperature-chart-section').style.display = 'none';
        return;
    }

    const token = getValidToken();
    if (!token) {
        showTemperatureError('Veuillez vous connecter d\'abord.');
        return;
    }

    const scale = '1day';

    try {
        document.getElementById('temperature-chart-section').style.display = 'block';

        const datasets = [];
        const colors = [
            '#2c5aa0', '#1e88e5', '#0d47a1', '#42a5f5', '#90caf9',
            '#ff5722', '#e64a19', '#d84315', '#ff7043', '#ffab40',
            '#4caf50', '#2e7d32', '#1b5e20', '#66bb6a', '#a5d6a7',
            '#9c27b0', '#7b1fa2', '#5e35b1', '#ba68c8', '#e1bee7'
        ];

        for (let i = 0; i < selectedTemperatureRooms.length; i++) {
            const roomId = selectedTemperatureRooms[i];
            const home = globalHomesData.find(h => h.id === selectedHomeId);
            const room = home.rooms.find(r => r.id === roomId);

            const response = await fetch(
                `${API.BASE}/getroommeasure?home_id=${selectedHomeId}&room_id=${roomId}&scale=${scale}&type=temperature`,
                {headers: {'Authorization': `Bearer ${token.access_token}`}}
            );

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.warn(`Erreur pour la pièce ${roomId}:`, error);
                continue;
            }

            const measureData = await response.json();
            const body = measureData.body;

            let measures = [];

            if (Array.isArray(body)) {
                measures = body;
            } else if (body && body.home) {
                measures = [body.home];
            } else if (body && (body.beg_time !== undefined || body.value !== undefined || body.values !== undefined)) {
                measures = [body];
            }

            if (measures.length === 0) {
                continue;
            }

            const dataset = {
                label: room.name || `Pièce ${room.id}`,
                data: [],
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '33',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.2,
                yAxisID: 'y'
            };

            for (const measure of measures) {
                if (measure.value && measure.value.length > 0) {
                    const begTime = measure.beg_time * 1000;
                    const stepTime = measure.step_time * 1000;

                    measure.value.forEach((entry, index) => {
                        const tempValue = Array.isArray(entry) ? entry[0] : entry;
                        const timestamp = begTime + (index * stepTime);

                        dataset.data.push({
                            x: timestamp,
                            y: tempValue
                        });
                    });
                } else if (measure.values && measure.values.length > 0) {
                    const begTime = measure.beg_time * 1000;
                    const stepTime = measure.step_time * 1000;

                    measure.values.forEach((entry, index) => {
                        const tempValue = entry.value !== undefined ? entry.value : entry;
                        const timestamp = begTime + (index * stepTime);

                        dataset.data.push({
                            x: timestamp,
                            y: tempValue
                        });
                    });
                }
            }

            if (dataset.data.length > 0) {
                datasets.push(dataset);
            } else {

            }
        }

        createTemperatureChart(datasets);

    } catch (error) {
        showTemperatureError(error.message);
        console.error(error);
    }
}

export function createTemperatureChart(datasets) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');

    if (temperatureChart) {
        temperatureChart.destroy();
    }

    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
                axis: 'x'
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Date / Heure'
                    },
                    ticks: {
                        callback: function (value, index, values) {
                            const date = new Date(value);
                            return date.toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Température (°C)'
                    },
                    min: Math.min(...datasets.flatMap(d => d.data.map(p => p.y))) - 2,
                    max: Math.max(...datasets.flatMap(d => d.data.map(p => p.y))) + 2,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    position: 'verticalCursor',
                    callbacks: {
                        title: function (context) {
                            const timestamp = context[0].parsed.x;
                            return new Date(timestamp).toLocaleString('fr-FR');
                        },
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw.y.toFixed(1)}°C`;
                        }
                    }
                }
            }
        }
    });

    const verticalLinePlugin = {
        id: 'verticalLine',
        afterDraw(chart) {
            if (chart.tooltip?._active?.length) {
                const ctx = chart.ctx;
                const x = chart.tooltip._active[0].element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#999';
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    Chart.register(verticalLinePlugin)

    Chart.Tooltip.positioners.verticalCursor = function (elements, eventPosition) {
        return {
            x: eventPosition.x,
            y: eventPosition.y - 15
        };
    };
}

function formatBatteryState(batteryState) {
    const labels = {
        very_low: 'très faible',
        low: 'faible',
        medium: 'moyenne',
        high: 'haute',
        full: 'pleine'
    };
    return labels[batteryState] || batteryState || '--';
}

export function formatBattery(module) {
    const level = module.batteryLevel;
    const state = formatBatteryState(module.batteryState);

    if (level !== undefined && level !== null) {
        return state !== '--' ? `${level}mV (${state})` : `${level}mV`;
    }

    return state;
}

window.changeRoomTemperature = async (roomId, delta) => {
    const roomCard = document.querySelector(`.room-card[data-room-id="${roomId}"]`);
    const setpointEl = roomCard.querySelector('.current-setpoint');

    let currentTemp = parseFloat(setpointEl.textContent);
    if (isNaN(currentTemp)) currentTemp = 20;

    const newTemp = Math.round((currentTemp + delta) * 2) / 2;

    const token = getValidToken();
    if (!token || !selectedHomeId) return;

    try {
        const params = new URLSearchParams();
        params.append('home_id', selectedHomeId);
        params.append('room_id', roomId);
        params.append('mode', 'manual');
        params.append('temp', newTemp);

        const response = await fetch(`${API.BASE}/setroomthermpoint`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (response.ok) {
            setpointEl.textContent = `${newTemp}°C`;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Erreur API:", errorData);
            alert("Erreur lors de la mise à jour : " + (errorData.error?.message || "Erreur inconnue"));
        }
    } catch (e) {
        console.error("Erreur réseau:", e);
    }
}
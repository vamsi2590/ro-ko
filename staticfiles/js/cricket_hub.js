// DOM Elements
const playerSearch = document.getElementById('playerSearch');
const playerProfile = document.getElementById('playerProfile');
const liveScores = document.getElementById('liveScores');
const scheduleList = document.getElementById('scheduleList');
const searchSpinner = document.getElementById('searchSpinner');
const liveSpinner = document.getElementById('liveSpinner');
const scheduleSpinner = document.getElementById('scheduleSpinner');
const player1Search = document.getElementById('player1Search');
const player2Search = document.getElementById('player2Search');
const compareSpinner = document.getElementById('compareSpinner');
const playerComparison = document.getElementById('playerComparison');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    updateLiveScores();
    loadSchedule();

    // Update live scores every 30 seconds
    setInterval(updateLiveScores, 30000);

    // Search input handlers
    playerSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchPlayer();
    });

    player1Search.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') comparePlayers();
    });

    player2Search.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') comparePlayers();
    });
});

// Fetch and display live matches
function updateLiveScores() {
    liveSpinner.style.display = 'inline-block';

    fetch('/live')
        .then(response => response.json())
        .then(data => {
            liveScores.innerHTML = data.map(match => `
                <div class="col-md-6 mb-4">
                    <div class="card h-100 position-relative">
                        <div class="card-body">
                            <span class="badge bg-danger live-badge">LIVE</span>
                            <h5 class="card-title">${match}</h5>
                            <p class="card-text text-muted">Updated: ${new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(error => {
            liveScores.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">Failed to load live scores. Please try again later.</div>
                </div>
            `;
        })
        .finally(() => {
            liveSpinner.style.display = 'none';
        });
}

// Fetch and display schedule
function loadSchedule() {
    scheduleSpinner.style.display = 'inline-block';

    fetch('/schedule')
        .then(response => response.json())
        .then(data => {
            scheduleList.innerHTML = data.map(item => {
                const parts = item.split(' - ');
                return `
                    <div class="col-md-6 col-lg-4">
                        <div class="schedule-card">
                            <h5>${parts[1] || 'Match details not available'}</h5>
                            <small>${parts[0] || 'Date not available'}</small>
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(error => {
            scheduleList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">Failed to load schedule. Please try again later.</div>
                </div>
            `;
        })
        .finally(() => {
            scheduleSpinner.style.display = 'none';
        });
}

// Search player function
function searchPlayer() {
    const playerName = playerSearch.value.trim();
    if (!playerName) return;

    searchSpinner.style.display = 'inline-block';
    searchSpinner.classList.add('rotating');
    playerProfile.style.display = 'none';

    fetch(`/players/${encodeURIComponent(playerName)}`)
        .then(response => {
            if (!response.ok) throw new Error('Player not found');
            return response.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);

            playerProfile.style.display = 'block';
            playerProfile.innerHTML = `
                <div class="card player-card mb-4">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <img src="${data.image || '/static/images/player-placeholder.jpg'}"
                                 class="img-fluid player-image" alt="${data.name}">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h2 class="card-title">${data.name}</h2>
                                <h4 class="text-muted">${data.country}</h4>
                                <p class="lead">${data.role}</p>

                                <div class="row mt-4">
                                    <div class="col-md-6">
                                        <h4>Batting Rankings</h4>
                                        <ul class="list-group mb-4">
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Test
                                                <span class="badge bg-primary rounded-pill">${data.rankings.batting.test || '-'}</span>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                ODI
                                                <span class="badge bg-primary rounded-pill">${data.rankings.batting.odi || '-'}</span>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                T20
                                                <span class="badge bg-primary rounded-pill">${data.rankings.batting.t20 || '-'}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="col-md-6">
                                        <h4>Bowling Rankings</h4>
                                        <ul class="list-group mb-4">
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Test
                                                <span class="badge bg-primary rounded-pill">${data.rankings.bowling.test || '-'}</span>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                ODI
                                                <span class="badge bg-primary rounded-pill">${data.rankings.bowling.odi || '-'}</span>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                T20
                                                <span class="badge bg-primary rounded-pill">${data.rankings.bowling.t20 || '-'}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 class="mt-5 mb-3">Career Statistics</h3>
                <div class="row">
                    <div class="col-md-6">
                        <h4>Batting</h4>
                        ${generateStatTable(data.batting_stats)}
                    </div>
                    <div class="col-md-6">
                        <h4>Bowling</h4>
                        ${generateStatTable(data.bowling_stats)}
                    </div>
                </div>
            `;

            // Scroll to player profile
            playerProfile.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            playerProfile.innerHTML = `
                <div class="alert alert-danger">
                    ${error.message || 'Failed to load player data. Please try another name.'}
                </div>
            `;
            playerProfile.style.display = 'block';
        })
        .finally(() => {
            searchSpinner.style.display = 'none';
            searchSpinner.classList.remove('rotating');
        });
}

function generateStatTable(stats) {
    if (!stats || !stats.test) return '<p>No statistics available</p>';

    const headers = Object.keys(stats.test);
    if (headers.length === 0) return '<p>No statistics available</p>';

    return `
        <div class="table-responsive">
            <table class="table table-striped stat-table">
                <thead>
                    <tr>
                        <th>Format</th>
                        ${headers.map(key =>
                            `<th>${key.replace(/_/g, ' ').toUpperCase()}</th>`
                        ).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${['test', 'odi', 't20'].map(format => stats[format] ? `
                        <tr>
                            <td>${format.toUpperCase()}</td>
                            ${headers.map(header =>
                                `<td>${stats[format][header] || '-'}</td>`
                            ).join('')}
                        </tr>
                    ` : '').join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Player comparison functions
function comparePlayers() {
    const player1Name = player1Search.value.trim();
    const player2Name = player2Search.value.trim();

    if (!player1Name || !player2Name) {
        alert("Please enter both player names");
        return;
    }

    compareSpinner.style.display = 'inline-block';
    compareSpinner.classList.add('rotating');

    Promise.all([
        fetchPlayerData(player1Name),
        fetchPlayerData(player2Name)
    ]).then(([player1, player2]) => {
        if (!player1 || !player2) throw new Error("Players not found");
        renderComparison(player1, player2);
    }).catch(error => {
        playerComparison.innerHTML = `
            <div class="alert alert-danger">${error.message}</div>
        `;
    }).finally(() => {
        compareSpinner.style.display = 'none';
        compareSpinner.classList.remove('rotating');
        playerComparison.style.display = 'block';
    });
}

async function fetchPlayerData(name) {
    try {
        const response = await fetch(`/players/${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error("Player not found");
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

function renderComparison(p1, p2) {
    playerComparison.innerHTML = `
        <div class="player-vs-container">
            <div class="comparison-divider">VS</div>
            <div class="row mb-4">
                <div class="col-md-6 pe-4">
                    <div class="card player-card-comparison player-1-card mb-4">
                        <div class="row g-0">
                            <div class="col-md-4">
                                <img src="${p1.image || '/static/images/player-placeholder.jpg'}"
                                    class="img-fluid player-image" alt="${p1.name}">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h2 class="card-title">${p1.name}</h2>
                                    <h4 class="text-muted">${p1.country}</h4>
                                    <p class="lead">${p1.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 ps-4">
                    <div class="card player-card-comparison player-2-card mb-4">
                        <div class="row g-0">
                            <div class="col-md-4">
                                <img src="${p2.image || '/static/images/player-placeholder.jpg'}"
                                    class="img-fluid player-image" alt="${p2.name}">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h2 class="card-title">${p2.name}</h2>
                                    <h4 class="text-muted">${p2.country}</h4>
                                    <p class="lead">${p2.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rankings Comparison Section -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card border-success mb-4">
                    <div class="card-header bg-success text-white">
                        <h4 class="mb-0">ICC Rankings</h4>
                    </div>
                    <div class="card-body">
                        <table class="table table-striped stat-table">
                            <thead>
                                <tr>
                                    <th>Ranking Type</th>
                                    <th>${p1.name}</th>
                                    <th>${p2.name}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Test Batting</td>
                                    <td>${p1.rankings.batting.test || '-'}</td>
                                    <td>${p2.rankings.batting.test || '-'}</td>
                                </tr>
                                <tr>
                                    <td>ODI Batting</td>
                                    <td>${p1.rankings.batting.odi || '-'}</td>
                                    <td>${p2.rankings.batting.odi || '-'}</td>
                                </tr>
                                <tr>
                                    <td>T20 Batting</td>
                                    <td>${p1.rankings.batting.t20 || '-'}</td>
                                    <td>${p2.rankings.batting.t20 || '-'}</td>
                                </tr>
                                <tr>
                                    <td>Test Bowling</td>
                                    <td>${p1.rankings.bowling.test || '-'}</td>
                                    <td>${p2.rankings.bowling.test || '-'}</td>
                                </tr>
                                <tr>
                                    <td>ODI Bowling</td>
                                    <td>${p1.rankings.bowling.odi || '-'}</td>
                                    <td>${p2.rankings.bowling.odi || '-'}</td>
                                </tr>
                                <tr>
                                    <td>T20 Bowling</td>
                                    <td>${p1.rankings.bowling.t20 || '-'}</td>
                                    <td>${p2.rankings.bowling.t20 || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-6">
                <h3>Batting Comparison</h3>
                ${generateComparisonTable('batting', p1, p2)}
            </div>
            <div class="col-md-6">
                <h3>Bowling Comparison</h3>
                ${generateComparisonTable('bowling', p1, p2)}
            </div>
        </div>
    `;
}

function generateComparisonTable(statType, p1, p2) {
    const p1Stats = p1[`${statType}_stats`];
    const p2Stats = p2[`${statType}_stats`];

    if (!p1Stats || !p2Stats) return '<p>No stats available</p>';

    const headers = Object.keys(p1Stats.test);
    const formats = ['test', 'odi', 't20'];

    let html = `
        <table class="table table-striped stat-table">
            <thead>
                <tr>
                    <th>Stat</th>
                    <th>${p1.name}</th>
                    <th>${p2.name}</th>
                </tr>
            </thead>
            <tbody>
    `;

    formats.forEach(format => {
        const p1Data = p1Stats[format] || {};
        const p2Data = p2Stats[format] || {};

        headers.forEach(header => {
            const statName = `${format.toUpperCase()} ${header.replace(/_/g, ' ').toUpperCase()}`;
            html += `
                <tr>
                    <td>${statName}</td>
                    <td>${p1Data[header] || '-'}</td>
                    <td>${p2Data[header] || '-'}</td>
                </tr>
            `;
        });
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
}

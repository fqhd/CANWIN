const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function init_game_state(playerData) {
    let state = {};
    state['teams'] = [];
    for (let i = 0; i < 2; i++) {
        let players = [];
        for (let j = 0; j < 5; j++) {
            players.push({
                'champion': playerData[i * 5 + j]['championName'],
                'kills': 0,
                'deaths': 0,
                'assists': 0,
                'baronTimer': 0,
                'elderTimer': 0,
                'deathTimer': 0,
                'level': 1,
                'creepscore': 0
            });
        }
        state['teams'].push({
            'players': players,
            'drakes': [],
            'barons': 0,
            'elders': 0,
            'rifts': 0,
            'turrets': [
                1, // Top outer
                1, // Top inner
                1, // Top base
                1, // Mid outer
                1, // Mid inner
                1, // Mid base
                1, // Bot outer
                1, // Bot inner
                1, // Bot base
                1, // Nexus
                1 // Nexus
            ],
            'inhibs': [
                0,
                0,
                0
            ]
        });
    }
    return state;
}

function get_player_teamId(playerData, playerName) {
    for (let p of playerData) {
        if (p['summonerName'] === playerName) {
            return p['team'] === 'ORDER' ? 0 : 1;
        }
    }
    return null;
}

function find_player(playerData, playerName) {
    for (let i = 0; i < playerData.length; i++) {
        if (playerData[i]['summonerName'] === playerName) {
            return i;
        }
    }
    return null;
}

function calc_death_timer(level, time) {
    const BRW = [6, 6, 8, 8, 10, 12, 16, 21, 26, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5];
    const currentBRW = BRW[level - 1];
    const currentTIF = calcTIF(time) / 100;
    return currentBRW + currentBRW * currentTIF;
}

function calcTIF(time) {
    if (time >= 0 && time < 15) {
        return 0;
    } else if (time >= 15 && time < 30) {
        return Math.ceil(2 * (time - 15)) * 0.425;
    } else if (time >= 30 && time < 45) {
        return 12.75 + Math.ceil(2 * (time - 30)) * 0.3;
    } else if (time >= 45 && time < 55) {
        return 21.75 + Math.ceil(2 * (time - 45)) * 1.45;
    } else {
        return 50;
    }
}

function get_characters_before_hash(inputString) {
    let result = '';
    for (let char of inputString) {
        if (char === '#') {
            break;
        }
        result += char;
    }
    return result;
}

function get_player_team_side(playerData, activePlayer) {
    let summonerName = activePlayer['summonerName'];
    summonerName = get_characters_before_hash(summonerName);
    for (let p of playerData) {
        if (p['summonerName'] === summonerName) {
            return p['team'];
        }
    }
    return null;
}

async function request(url) {
	let response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' }, agent: new https.Agent({ rejectUnauthorized: false }) });
	response = await response.json();
	return response;
}

async function query_game_state() {
	const player_data = await request('https://127.0.0.1:2999/liveclientdata/playerlist');
	let event_data = await request('https://127.0.0.1:2999/liveclientdata/eventdata');
	const game_data = await request('https://127.0.0.1:2999/liveclientdata/gamestats');
	const active_player = await request('https://127.0.0.1:2999/liveclientdata/activeplayer');
	const team_side = get_player_team_side(player_data, active_player);
	const state = init_game_state(player_data);
	state.time = game_data.gameTime;
	event_data = event_data.Events;

	for (let i = 0; i < 2; i++) {
		const team = state.teams[i];
		for (let j = 0; j < 5; j++) {
			const player = team.players[j];
			player.level = player_data[i * 5 + j].level;
			player.kills = player_data[i * 5 + j].scores.kills;
			player.deaths = player_data[i * 5 + j].scores.deaths;
			player.assists = player_data[i * 5 + j].scores.assists;
			player.creepscore = player_data[i * 5 + j].scores.creepScore;
		}
	}
	for (const event of event_data) {
		if (event.EventName == 'TurretKilled') {
			let turret_team = event.TurretKilled.substring(7, 9);
			if (turret_team === 'T1') { // Blue Side Tower
				let tower_to_index = {
					'Turret_T1_L_03_A': 0,
					'Turret_T1_L_02_A': 1,
					'Turret_T1_C_06_A': 2,
					'Turret_T1_C_05_A': 3,
					'Turret_T1_C_04_A': 4,
					'Turret_T1_C_03_A': 5,
					'Turret_T1_R_03_A': 6,
					'Turret_T1_R_02_A': 7,
					'Turret_T1_C_07_A': 8,
					'Turret_T1_C_02_A': 9,
					'Turret_T1_C_01_A': 10
				};
				let tower_index = tower_to_index[event.TurretKilled];
				state.teams[0].turrets[tower_index] = 0;
			} else { // Red Side Tower
				let tower_to_index = {
					'Turret_T2_L_03_A': 0,
					'Turret_T2_L_02_A': 1,
					'Turret_T2_L_01_A': 2,
					'Turret_T2_C_05_A': 3,
					'Turret_T2_C_04_A': 4,
					'Turret_T2_C_03_A': 5,
					'Turret_T2_R_03_A': 6,
					'Turret_T2_R_02_A': 7,
					'Turret_T2_R_01_A': 8,
					'Turret_T2_C_02_A': 9,
					'Turret_T2_C_01_A': 10
				};
				let tower_index = tower_to_index[event.TurretKilled];
				state.teams[1].turrets[tower_index] = 0;
			}
		}else if(event.EventName == 'InhibKilled') {
			let inhib_team = event.InhibKilled.substring(9, 11);
			let timeSinceKill = game_data.gameTime - event.EventTime;
			if (inhib_team === 'T2') {
				let inhib_to_index = {
					'Barracks_T2_L1': 0,
					'Barracks_T2_C1': 1,
					'Barracks_T2_R1': 2
				};
				let inhib_index = inhib_to_index[event.InhibKilled];
				state.teams[1].inhibs[inhib_index] = Math.max(300 - timeSinceKill, 0);
			} else {
				let inhib_to_index = {
					'Barracks_T1_L1': 0,
					'Barracks_T1_C1': 1,
					'Barracks_T1_R1': 2
				};
				let inhib_index = inhib_to_index[event.InhibKilled];
				state.teams[0].inhibs[inhib_index] = Math.max(300 - timeSinceKill, 0);
			}
		}else if(event.EventName == 'DragonKill') {
			if (event.DragonType === 'Elder') {
				let killer = event.KillerName;
				let teamid = get_player_teamId(player_data, killer);
				state.teams[teamid].elders += 1;
				let timeSinceElder = game_data.gameTime - event.EventTime;
				for (let p of state.teams[teamid].players) {
					p.elderTimer = Math.max(150 - timeSinceElder, 0);
				}
			} else {
				let killer = event.KillerName;
				let teamid = get_player_teamId(player_data, killer);
				state.teams[teamid].drakes.push(event.DragonType.toUpperCase() + '_DRAGON');
			}
		}else if(event.EventName == 'BaronKill') {
			let killer = event.KillerName;
			let teamid = get_player_teamId(player_data, killer);
			state.teams[teamid].barons += 1;
			let timeSinceNash = game_data.gameTime - event.EventTime;
			for (let p of state.teams[teamid].players) {
				p.baronTimer = Math.max(180 - timeSinceNash, 0);
			}
		}else if(event.EventName == 'HeraldKill') {
			let killer = event.KillerName;
			let teamid = get_player_teamId(player_data, killer);
			state.teams[teamid].rifts += 1;
		}else if(event.EventName == 'ChampionKill') {
			let victimid = find_player(player_data, event.VictimName);
			let victim_team_id = Math.floor(victimid / 5);
			let victim = state.teams[victim_team_id].players[victimid % 5];
			let deathTime = event.EventTime;
			let timeSinceDeath = game_data.gameTime - deathTime;
			let deathTimer = calc_death_timer(victim.level, state.time / 60);
			victim.deathTimer = Math.max(deathTimer - timeSinceDeath, 0);
		}
	}
	return [state, team_side]
}

module.exports = {
	query_game_state
};
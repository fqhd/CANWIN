import { api_call, deep_copy } from "./utils.js";
import fs from 'fs';

let champion_data = fs.readFileSync('champion.json');
champion_data = JSON.parse(champion_data);

export async function get_game_data(MATCH_ID, key) {
    // Get game and timeline data
    let game = await api_call(`https://europe.api.riotgames.com/lol/match/v5/matches/${MATCH_ID}?api_key=${key}`);
    game = await game.json();
    let timeline = await api_call(`https://europe.api.riotgames.com/lol/match/v5/matches/${MATCH_ID}/timeline?api_key=${key}`);
    timeline = await timeline.json();

    // Create internal state
    const state = await create_initial_state(timeline.info.participants, game, key);

    const states = [];
    for (const frame of timeline.info.frames) {
        update_with_frame(state, frame);
        const parsed_state = parse_state(state);
        states.push(parsed_state);
    }
    return states;
}

async function create_initial_state(participants, game, key) {
    const state = {
        teams: [],
        time: 0,
        win: game.info.participants[0].win,
    };
    for (let i = 0; i < 2; i++) {
        const team = {
            players: [],
            drakes: [],
            barons: 0,
            elders: 0,
            rifts: 0,
            towers: [
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
            inhibCounters: [
                0, // Top
                0, // Mid
                0 // Bot
            ]
        };
        for (let j = 0; j < 5; j++) {
            const playerIndex = i * 5 + j;
            const champion = game.info.participants[playerIndex].championName;
            const mastery = await get_champion_mastery(participants, champion, playerIndex, key);
            const summonerLevel = await get_summoner_level(participants, playerIndex, key);
            team.players.push({
                champion: champion,
                masteryPoints: mastery.points,
                masteryLevel: mastery.level,
                smurf: summonerLevel < 40,
                kills: 0,
                deaths: 0,
                assists: 0,
                baronTimer: 0,
                elderTimer: 0,
                respawnTimer: 0.0,
                summonerLevel: summonerLevel,
                level: 1,
                creepscore: 0,
            });
        }
        state.teams.push(team);
    }
    return state;
}

async function get_champion_mastery(participants, champion, playerIndex, key) {
    const puuid = participants[playerIndex].puuid;
    console.log(champion);
    const champion_id = champion_data.data[champion].key;
    let mastery = await api_call(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${champion_id}?api_key=${key}`);
    mastery = await mastery.json();
    return {
        points: mastery.championPoints,
        level: mastery.championLevel,
    }
}

async function get_summoner_level(participants, playerIndex, key) {
    const puuid = participants[playerIndex].puuid;
    let summonerData = await api_call(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${key}`);
    summonerData = await summonerData.json();
    return summonerData.summonerLevel;
}

function update_with_frame(state, frame) {
    update_general_stats(state, frame);
    for (const event of frame.events) {
        update_with_event(state, event);
    }
}

function update_general_stats(state, frame) {
    for(const participant_id in frame.participantFrames) {
        const participant = frame.participantFrames[participant_id];
        const participant_id_int = parseInt(participant_id) - 1;
        const team_id = parseInt(participant_id_int / 5);
        state.teams[team_id].players[participant_id_int % 5].creepscore = participant.minionsKilled + participant.jungleMinionsKilled;
        state.teams[team_id].players[participant_id_int % 5].level = participant.level;
    }
}

function update_with_event(state, event) {
    switch (event.type) {
        case 'CHAMPION_KILL':
            process_champion_kill(state, event);
            break;
    }
}

function process_champion_kill(state, event) {
    const time = event.timestamp / 1000 / 60;
    const teamId = parseInt((event.killerId - 1) / 5);
    if (event.killerId > 0) {
        state.teams[teamId].players[(event.killerId - 1) % 5].kills += 1;
    }
    const victimTeamId = parseInt((event.victimId - 1) / 5);
    const victim = state.teams[victimTeamId].players[(event.victimId - 1) % 5];
    victim.deaths += 1;
    victim.baronTimer = 0;
    victim.elderTimer = 0;
    victim.deathTimer = calc_death_timer(victim.level, time);
    if (event.assistingParticipantIds) {
        for (const assistId of event.assistingParticipantIds) {
            const assistTeamId = parseInt((assistId - 1) / 5);
            state.teams[assistTeamId].players[(assistId - 1) % 5].assists += 1;
        }
    }
}

export function calc_death_timer(level, time) {
    const BRW = [6, 6, 8, 8, 10, 12, 16, 21, 26, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5];
    const current_brw = BRW[level - 1];
    const current_tif = calc_tif(time) / 100;
    return current_brw + current_brw * current_tif;
}

export function calc_tif(time) {
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

function parse_state(state) {
    const parsed_state = deep_copy(state);
    return parsed_state;
}
import { api_call } from "./utils.js";
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
        parsed_state = parse_state(state);
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
            towers: 11,
            inhibCounters: []
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
    for (const event in frame.events) {
        update_with_event(state, event);
    }
}

function update_with_event(state, event) {
    switch(event.type) {
        case 'ITEM_PURCHASED':

        break;
    }
}
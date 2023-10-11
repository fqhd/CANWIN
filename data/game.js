// MATCH_ID: EUW1_6623848520
import { api_call } from "./utils.js";

export async function get_game_data(MATCH_ID, key) {
    // Get the timeline
    let timeline = await api_call(`https://europe.api.riotgames.com/lol/match/v5/matches/${MATCH_ID}/timeline?api_key=${key}`);
    timeline = await timeline.json();

    // Create internal state
    const internal_state = await create_initial_state(timeline.info.participants, key);

    // For each frame in timeline:
    //      - Update state using all events leading up to this point
    //      - Parse internal state and append static state to list of states
    // Return list of states
}

async function create_initial_state(participants, key) {
    const state = {
        teams: [],
        time: 0,
        win: match.info.participants[0].win,
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
            const champion = match.info.participants[playerIndex].championName;
            const mastery = await get_champion_mastery(participants, playerIndex, champion, key);
            const summonerLevel = await get_summoner_level(participants, playerIndex, key);
            team.players.push({
                champion: champion,
                masteryPonits: mastery.points,
                masteryLevel: mastery.level,
                lastPlayTime: mastery.lastPlayTime,
                smurf: summonerLevel < 40,
                kills: 0,
                deaths: 0,
                assists: 0,
                baronTimer: 0,
                elderTimer: 0,
                respawnTimer: 0.1,
                summonerLevel: summonerLevel,
                level: 1,
                creepscore: 0,
            });
        }
        state.teams.push(team);
    }
    return state;
}

async function get_champion_mastery(participants, playerIndex, champion) {
    const puuid = participants[playerIndex].puuid;
    // Get ID of champion
    // Query champion mastery level and points
    // Return an object that contains this information
}

async function get_summoner_level(participants, playerIndex) {
    const puuid = participants[playerIndex].puuid;

}
import { api_call } from "./utils.js";
import { api_keys } from "./api_keys.js";

const START_DATE = '2023.12.10';

function shuffle(array) {
	let currentIndex = array.length,  randomIndex;

	while (currentIndex > 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
		array[randomIndex], array[currentIndex]];
	}

	return array;
}

async function getSummonerIDs(rank, tier, page, key) {
	const summonerIDs = [];
	if(rank == 'CHALLENGER') {
		let response = await api_call(`https://euw1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${key}`);
		response = await response.json();
		for (const summoner of response.entries) {
			summonerIDs.push(summoner.summonerId);
		}
	}else if(rank == 'GRANDMASTER') {
		let response = await api_call(`https://euw1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${key}`);
		response = await response.json();
		for (const summoner of response.entries) {
			summonerIDs.push(summoner.summonerId);
		}
	}else if(rank == 'MASTER') {
		let response = await api_call(`https://euw1.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${key}`);
		response = await response.json();
		for (const summoner of response.entries) {
			summonerIDs.push(summoner.summonerId);
		}
	}else{
		let response = await api_call(`https://euw1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${rank}/${tier}?page=${page}&api_key=${key}`);
		response = await response.json();
		for (const summoner of response) {
			summonerIDs.push(summoner.summonerId);
		}
	}
	shuffle(summonerIDs);
	return summonerIDs;
}

async function getSummonerMatchIDs(summonerID, key) {
	let puuid = await api_call(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/${summonerID}?api_key=${key}`);
	puuid = await puuid.json();
	puuid = puuid.puuid;

	const start = Math.floor(new Date(START_DATE).getTime() / 1000);

	let matchHistory = await api_call(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?startTime=${start}&queue=420&start=0&count=50&api_key=${key}`)
	matchHistory = await matchHistory.json();

	return matchHistory;
}

async function get_match_id_batch(rank, tier, page, key) {
	let matchIDs = [];
	const limit = 250;

	const summonerIDs = await getSummonerIDs(rank, tier, page, key);
	for (const summoner_id of summonerIDs) {
		matchIDs = matchIDs.concat(await getSummonerMatchIDs(summoner_id, key));
		if(matchIDs.length >= limit) {
			break;
		}
	}

	return matchIDs;
}

export async function getMatchIDs(rank) {
	const promises = [];

	const tiers = ['I', 'II', 'III', 'IV'];
	let idx = 0;
	for (const tier of tiers) {
		for(let i = 0; i < 10; i++) {
			promises.push(get_match_id_batch(rank, tier, i+1, api_keys[idx]));
			idx++;
		}
	}

	const results = await Promise.all(promises);
	const matchIDs = [].concat(...results);

	shuffle(matchIDs);
	return matchIDs;
}

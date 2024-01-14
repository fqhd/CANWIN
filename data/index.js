import { get_game_data } from "./game.js";
import fs from 'fs';
import { api_keys } from "./api_keys.js";
import { getMatchIDs } from "./get_matche_ids.js";

async function get_batch(match_ids) {
	const promises = [];
	for(let i = 0; i < match_ids.length; i++) {
		promises.push(get_game_data(match_ids[i], api_keys[i]));
	}
	const results = await Promise.all(promises);
	const batch = [].concat(...results);
	const cleanBatch = [];
	for(let i = 0; i < batch.length; i++) {
		if (batch[i] != null ) {
			cleanBatch.push(batch[i]);
		}
	}
	return cleanBatch;
}

(async () => {
	let matchIDs = await getMatchIDs('EMERALD');
	matchIDs = new Set(matchIDs);
	matchIDs = Array.from(matchIDs);

	console.log(`Processing ${matchIDs.length} matches`);

	let idx = 0;
	for(let i = 0; i < matchIDs.length; i += api_keys.length) {
		let batch = await get_batch(matchIDs.slice(i, i + api_keys.length));
		batch = JSON.stringify(batch);
		fs.writeFileSync(`match_data/${idx}.json`, batch);
		idx += 1;
		console.log(`Processed ${idx*api_keys.length} matches`);
	}
	
})();
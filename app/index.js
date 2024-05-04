import { query_game_state } from "./game.js";

async function main() {
	const [response, side] = await query_game_state();
	console.log(response);
	console.log(side);
}

main();
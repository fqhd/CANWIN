import { get_game_data } from "./game.js";
import { calc_death_timer, calc_tif } from "./game.js";
import fs from 'fs';
import { configDotenv } from "dotenv";

configDotenv();

(async () => {
    const states = await get_game_data('EUW1_6650568206', process.env.RIOT_KEY);
    const states_string = JSON.stringify(states);
    fs.writeFileSync('test.json', states_string);
})();
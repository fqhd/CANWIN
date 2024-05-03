import game as game
import time
import os
import json
import requests

while True:
	state, side = game.query_game_state()
	state = json.dumps(state)
	response = requests.get('http://api.whoisfahd.dev/canwin', headers={'state': state})
	pred = float(response.text)
	if side == 'CHAOS':
		pred = 1 - pred
	os.system('cls')
	print(f'{round(pred * 100)}%')
	time.sleep(5)
import math
import requests
from urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

def init_game_state(player_data):
	state = {}
	state['teams'] = []
	for i in range(2):
		players = []
		for j in range(5):
			players.append({
				'champion': player_data[i*5+j]['championName'],
				'kills': 0,
				'deaths': 0,
				'assists': 0,
				'baronTimer': 0,
				'elderTimer': 0,
				'deathTimer': 0,
				'level': 1,
				'creepscore': 0
			})
		state['teams'].append({
			'players': players,
			'drakes': [],
			'barons': 0,
			'elders': 0,
			'rifts': 0,
			'turrets': [
				1, # Top outer
				1, # Top inner
				1, # Top base
				1, # Mid outer
				1, # Mid inner
				1, # Mid base
				1, # Bot outer
				1, # Bot inner
				1, # Bot base
				1, # Nexus
				1 # Nexus
			],
			'inhibs': [
				0,
				0,
				0
			]
		})
	return state

def get_player_teamId(player_data, player_name):
	for p in player_data:
		if p['summonerName'] == player_name:
			if p['team'] == 'ORDER':
				return 0
			else:
				return 1
	return None

def find_player(player_data, player_name):
	for i in range(len(player_data)):
		if player_data[i]['summonerName'] == player_name:
			return i
	return None
	
def calc_death_timer(level, time):
	BRW = [6, 6, 8, 8, 10, 12, 16, 21, 26, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5]
	current_brw = BRW[level - 1]
	current_tif = calc_tif(time) / 100
	return current_brw + current_brw * current_tif

def calc_tif(time):
	if time >= 0 and time < 15:
		return 0
	elif time >= 15 and time < 30:
		return math.ceil(2 * (time - 15)) * 0.425
	elif time >= 30 and time < 45:
		return 12.75 + math.ceil(2 * (time - 30)) * 0.3
	elif time >= 45 and time < 55:
		return 21.75 + math.ceil(2 * (time - 45)) * 1.45
	else:
		return 50

def query_game_state():
	player_data = requests.get('https://127.0.0.1:2999/liveclientdata/playerlist', verify=False)
	event_data = requests.get('https://127.0.0.1:2999/liveclientdata/eventdata', verify=False)
	game_data = requests.get('https://127.0.0.1:2999/liveclientdata/gamestats', verify=False)
	player_data = player_data.json()
	event_data = event_data.json()
	game_data = game_data.json()
	state = init_game_state(player_data)
	state['time'] = game_data['gameTime']
	event_data = event_data['Events']
	for i in range(2):
		team = state['teams'][i]
		for j in range(5):
			player = team['players'][j]
			player['level'] = player_data[i*5+j]['level']
			player['kills'] = player_data[i*5+j]['scores']['kills']
			player['deaths'] = player_data[i*5+j]['scores']['deaths']
			player['assists'] = player_data[i*5+j]['scores']['assists']
			player['creepscore'] = player_data[i*5+j]['scores']['creepScore']
	for event in event_data:
		if event['EventName'] == 'TurretKilled':
			turret_team = event['TurretKilled'][7:9]
			if turret_team == 'T1': # Blue Side Tower
				tower_to_index = {
					'Turret_T1_L_03_A': 0,
					'Turret_T1_L_02_A': 1,
					'Turret_T1_L_01_A': 2,
					'Turret_T1_C_05_A': 3,
					'Turret_T1_C_04_A': 4,
					'Turret_T1_C_03_A': 5,
					'Turret_T1_R_03_A': 6,
					'Turret_T1_R_02_A': 7,
					'Turret_T1_R_01_A': 8,
					'Turret_T1_C_02_A': 9,
					'Turret_T1_C_01_A': 10
				}
				tower_index = tower_to_index[event['TurretKilled']]
				state['teams'][0]['turrets'][tower_index] = 0
			else: # Red Side Tower
				tower_to_index = {
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
				}
				tower_index = tower_to_index[event['TurretKilled']]
				state['teams'][1]['turrets'][tower_index] = 0
		elif event['EventName'] == 'InhibKilled':
			inhib_team = event['InhibKilled'][9:11]
			timeSinceKill = game_data['gameTime'] - event['EventTime']
			if inhib_team == 'T2':
				inhib_to_index = {
					'Barracks_T2_L1': 0,
					'Barracks_T2_C1': 1,
					'Barracks_T2_R1': 2
				}
				inhib_index = inhib_to_index[event['InhibKilled']]
				state['teams'][1]['inhibs'][inhib_index] = max(300 - timeSinceKill, 0)
			else:
				inhib_to_index = {
					'Barracks_T1_L1': 0,
					'Barracks_T1_C1': 1,
					'Barracks_T1_R1': 2
				}
				inhib_index = inhib_to_index[event['InhibKilled']]
				state['teams'][0]['inhibs'][inhib_index] = max(300 - timeSinceKill, 0)
		elif event['EventName'] == 'DragonKill':
			if event['DragonType'] == 'Elder':
				killer = event['KillerName']
				teamid = get_player_teamId(player_data, killer)
				state['teams'][teamid]['elders'] += 1
				timeSinceElder = game_data['gameTime'] - event['EventTime']
				for p in state['teams'][teamid]['players']:
					p['elderTimer'] = max(150 - timeSinceElder, 0)
			else:
				killer = event['KillerName']
				teamid = get_player_teamId(player_data, killer)
				state['teams'][teamid]['drakes'].append(event['DragonType'].upper() + '_DRAGON')
		elif event['EventName'] == 'BaronKill':
			killer = event['KillerName']
			teamid = get_player_teamId(player_data, killer)
			state['teams'][teamid]['barons'] += 1
			timeSinceNash = game_data['gameTime'] - event['EventTime']
			for p in state['teams'][teamid]['players']:
				p['baronTimer'] = max(180 - timeSinceNash, 0)
		elif event['EventName'] == 'HeraldKill':
			teamid = get_player_teamId(event['KillerName'])
			state['teams'][teamid]['rifts'] += 1
		elif event['EventName'] == 'ChampionKill':
			victimid = find_player(player_data, event['VictimName'])
			victim_team_id = victimid // 5
			victim = state['teams'][victim_team_id]['players'][victimid % 5]
			deathTime = event['EventTime']
			timeSinceDeath = game_data['gameTime'] - deathTime
			deathTimer = calc_death_timer(victim['level'], state['time'])
			victim['deathTimer'] = max(deathTimer - timeSinceDeath, 0)
	return state
		

		
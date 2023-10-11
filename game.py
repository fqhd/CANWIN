import time
import json
from key import API_KEY
import requests
import urllib

class Game():
	def __init__(self, player_data):
		self.teams = []
		self.last_time = time.time()
		self.last_time = time.time()
		with open('champion.json', encoding='utf-8') as f:
			self.champion = json.load(f)
		for i in range(2):
			players = []
			for j in range(5):
				players.append({
					'baronTimer': 0,
					'elderTimer': 0,
					'champion': player_data[i*5+j]['championName'],
					'mastery:': self.get_champion_mastery(player_data, i*5+j),
					'last_time_champion_played': self.get_last_time_champion_played(player_data, i*5+j),
					'last_time_game_played': self.get_last_time_game_played(player_data, i*5+j)
				})
			self.teams.append({
				'players': players,
				'drakes': 0,
				'turrets': 11,
				'inhibTimers': []
			})

	def update(self, player_data, event_data):
		event_data = event_data['Events']
		now_time = time.time()
		time_diff = now_time - self.last_time
		self.last_time = now_time
		for i in range(2):
			for j in range(5):
				self.teams[i]['players'][j]['level'] = player_data[i*5+j]['level']
				self.teams[i]['players'][j]['kills'] = player_data[i*5+j]['scores']['kills']
				self.teams[i]['players'][j]['deaths'] = player_data[i*5+j]['scores']['deaths']
				self.teams[i]['players'][j]['assists'] = player_data[i*5+j]['scores']['assists']
				self.teams[i]['players'][j]['creepScore'] = player_data[i*5+j]['scores']['creepScore']
				self.teams[i]['players'][j]['baronTimer'] -= time_diff
				self.teams[i]['players'][j]['elderTimer'] -= time_diff
			for j in range(len(self.teams[i]['inhibTimers'])):
				self.teams[i]['inhibTimers'][j] -= time_diff
				if(self.teams[i]['inhibTimers'][j] < 0):
					del self.teams[i]['inhibTimers'][j]
		for event in event_data:
			if event['EventName'] == 'TurretKilled':
				teamId = int(event['TurretKilled'][8]) - 1
				self.teams[teamId]['turrets'] -= 1
			elif event['EventName'] == 'InhibKilled':
				teamId = int(event['InhibKilled'][10]) - 1
				self.teams[teamId]['inhibTimers'].append(60*3)
			elif event['EventName'] == 'DragonKill':
				if event['DragonType'] == 'Elder':
					teamId = self.get_player_teamId(event['KillerName'])
					for player in self.teams[teamId]['players']:
						player['elderTimer'] = 60*3
				else:
					teamId = self.get_player_teamId(event['KillerName'])
					self.teams[teamId]['drakes'] += 1
			elif event['EventName'] == 'BaronKill':
				teamId = self.get_player_teamId(event['KillerName'])
				for player in self.teams[teamId]['players']:
					player['baronTimer'] = 60*3
	
	def get_player_teamId(self, summonerName):
		for i in range(2):
			for j in range(5):
				if self.teams[i]['players'][j]['summonerName'] == summonerName:
					return i
		return 0

	def get_state(self):
		state = []
		for team in self.teams:
			team_state = {}
			team_state['Turrets'] = team['turrets']
			team_state['Inhibs'] = 3 - len(team['inhibTimers'])
			team_state['Dragons'] = team['drakes']
			team_state['Players'] = []
			for player in team['players']:
				player_state = {}
				player_state['Champion'] = player['champion']
				player_state['Has baron'] = player['baronTimer'] > 0
				player_state['Has elder'] = player['elderTimer'] > 0
				player_state['Level'] = player['level']
				player_state['K'] = player['kills']
				player_state['D'] = player['deaths']
				player_state['A'] = player['assists']
				player_state['CS'] = player['creepScore']
			state.append(team_state)
		return state
	
	def get_last_time_champion_played(self, player_data, player_index):
		player_name = player_data[player_index]['summonerName']

	def get_last_time_game_played(self, player_data, player_index):
		pass

	def get_champion_mastery(self, player_data, player_index):
		champion_name = player_data[player_index]['championName']
		champion_id = self.champion['data'][champion_name]['key']
		player_name = player_data[player_index]['summonerName']
		puuid = self.get_puuid(player_name)
		link = f'https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/by-champion/{champion_id}?api_key={API_KEY}'
		response = requests.get(link)
		response_json = response.json()
		mastery = response_json['championPoints']
		return mastery

	def get_puuid(self, player_name):
		url_encoded_name = urllib.parse.quote(player_name.encode('utf-8'))
		link = f'https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/{url_encoded_name}?api_key={API_KEY}'
		response = requests.get(link)
		response_json = response.json()
		return response_json['puuid'] 
		
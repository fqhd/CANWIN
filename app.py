from game import Game
import requests

player_data = requests.get('https://127.0.0.1:2999/liveclientdata/playerlist', verify=False)
event_data = requests.get('https://127.0.0.1:2999/liveclientdata/eventdata', verify=False)
player_data = player_data.json()
event_data = event_data.json()

print(player_data[-1])

# game = Game(player_data)

# game.update(player_data, event_data)

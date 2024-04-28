import os
import json
import pandas as pd
import numpy as np
import random
from tqdm import tqdm

df = pd.read_csv('champions.csv')

def get_champ_vec(champ_name):
	arr = []
	row = df.loc[df['Champion'] == champ_name].iloc[0]
	for i in range(1, 16):
		if i == 7:
			if row.iloc[i] == 1:
				arr.append(1)
				arr.append(0)
				arr.append(0)
			elif row.iloc[i] == 2:
				arr.append(0)
				arr.append(1)
				arr.append(0)
			elif row.iloc[i] == 3:
				arr.append(0)
				arr.append(0)
				arr.append(1)
		else:
			arr.append(row.iloc[i] / 10)
	return arr

def parse_frame(frame):
	drake_names = ['EARTH_DRAGON', 'WATER_DRAGON', 'FIRE_DRAGON', 'HEXTECH_DRAGON', 'AIR_DRAGON', 'CHEMTECH_DRAGON']
	data = []
	for t in frame['teams']:
		for p in t['players']:
			data += get_champ_vec(p['champion'])
			# data.append(p['masteryPoints'] / 1000000)
			# data.append(p['masteryLevel'] / 7)
			# data.append(int(p['smurf']))
			data.append(p['kills'] / 20)
			data.append(p['deaths'] / 16)
			data.append(p['assists'] / 40)
			data.append(p['baronTimer'] / 3)
			data.append(p['elderTimer'] / 3)
			data.append(p['deathTimer'] / 79)
			# data.append(p['summonerLevel'] / 1000)
			data.append(p['level'] / 18)
			data.append(p['creepscore'] / 400)
		for d in t['drakes'][:4]:
			oh_drake = [0, 0, 0, 0, 0, 0] # one hot encoded drake
			if d != 'ELDER_DRAGON':
				oh_drake[drake_names.index(d)] = 1
			data += oh_drake
		remaining_drakes = max(4 - len(t['drakes']), 0)
		for _ in range(remaining_drakes):
			oh_drake = [0, 0, 0, 0, 0, 0] # one hot encoded drake
			data += oh_drake
		data.append(t['barons'] / 2)
		data.append(t['elders'] / 2)
		data.append(t['rifts'] / 2)
		data += t['towers']
		data.append(t['inhibs'][0] / 5)
		data.append(t['inhibs'][1] / 5)
		data.append(t['inhibs'][2] / 5)
	data.append(frame['time'] / 30)
	data.append(int(frame['win']))
	return data

def get_file_paths():
    file_paths = []
    dirs = os.listdir('data/match_data')
    for d in dirs:
        files = os.listdir(f'data/match_data/{d}')
        for f in files:
            path = f'data/match_data/{d}/{f}'
            file_paths.append(path)
    return file_paths
file_paths = get_file_paths()

random.shuffle(file_paths)

def load_frame(path):
    with open(path) as f:
        frame = json.load(f)
    return frame

data = np.empty(shape=(len(file_paths), len(parse_frame(load_frame(file_paths[0])))), dtype='float32')
for idx, path in tqdm(enumerate(file_paths)):
	frame = load_frame(path)
	encoded_frame = parse_frame(frame)
	numpy_frame = np.array(encoded_frame)
	data[idx] = numpy_frame
np.save('dataset', data)

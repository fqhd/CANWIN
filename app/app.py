import game as game
import torch
from network import TinyNet
import time
import os

net = TinyNet()
net.load_state_dict(torch.load('net.pth'))
net.eval()

while True:
	state, side = game.query_game_state()
	frame = game.parse_frame(state)
	frame = torch.tensor(frame, dtype=torch.float32)
	frame = torch.unsqueeze(frame, 0)
	with torch.no_grad():
		pred = net(frame)
	pred = torch.sigmoid(pred)
	pred = pred.item()
	if side == 'CHAOS':
		pred = 1 - pred
	os.system('cls')
	print(f'{round(pred * 100)}%')
	time.sleep(5)
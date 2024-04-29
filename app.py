import game
import torch
from networks import TinyNet
import time

net = TinyNet()
net.eval()
net.load_state_dict(torch.load('net.pth'))

while True:
	state = game.query_game_state()
	frame = game.parse_frame(state)
	frame = torch.tensor(frame, dtype=torch.float32)
	frame = torch.unsqueeze(frame, 0)
	with torch.no_grad():
		pred = net(frame)
	pred = torch.sigmoid(pred)
	pred = pred.item() * 100
	print(pred)
	time.sleep(5)
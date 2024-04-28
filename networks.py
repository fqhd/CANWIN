import torch
from torch import nn

class TinyNet(nn.Module):
	def __init__(self):
		super().__init__()
		self.stack = nn.Sequential(
			nn.Linear(373, 128),
			nn.ReLU(True),

			nn.Linear(128, 64),
			nn.ReLU(True),

			nn.Linear(64, 1)
		)

	def forward(self, x):
		return self.stack(x)
	

if __name__ == '__main__':
	x = torch.randn((256, 372))
	net = TinyNet()
	outputs = net(x)
	print(outputs)
	print(x.shape)
	print(outputs.shape)
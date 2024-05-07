from torch import nn

class TinyNet(nn.Module):
	def __init__(self):
		super().__init__()
		self.stack = nn.Sequential(
			nn.Linear(333, 128),
			nn.ReLU(True),

			nn.Linear(128, 64),
			nn.ReLU(True),

			nn.Linear(64, 1)
		)

	def forward(self, x):
		return self.stack(x)
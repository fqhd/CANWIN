import matplotlib.pyplot as plt
import torch
from networks import TinyNet
from dataset import train_dl, val_dl, test_dl
from tqdm import tqdm

device = (
	'cuda' if torch.cuda.is_available() else
	'mps' if torch.backends.mps.is_available() else
	'cpu'
)

print(f'Using {device}')

net = TinyNet()
net = net.to(device)

optim = torch.optim.Adam(net.parameters(), lr=2e-5)
loss_fn = torch.nn.BCEWithLogitsLoss()

def train(dl):
	avg_loss = 0
	avg_acc = 0
	for inputs, targets in tqdm(dl):
		inputs = inputs.to(device)
		targets = targets.to(device)

		preds = net(inputs)
		preds = preds.view(-1)
		loss = loss_fn(preds, targets)

		net.zero_grad()
		loss.backward()
		optim.step()

		avg_loss += loss.item()

		preds = torch.sigmoid(preds)
		acc = (preds.round() == targets).float().sum().item() / len(targets)
		avg_acc += acc
	avg_loss /= len(dl)
	avg_acc /= len(dl)

	return avg_loss, avg_acc

def test(dl):
	avg_loss = 0
	avg_acc = 0
	for inputs, targets in tqdm(dl):
		inputs = inputs.to(device)
		targets = targets.to(device)

		with torch.no_grad():
			preds = net(inputs)
		preds = preds.view(-1)
		loss = loss_fn(preds, targets)

		avg_loss += loss.item()

		preds = torch.sigmoid(preds)
		acc = (preds.round() == targets).float().sum().item() / len(targets)
		avg_acc += acc
	avg_loss /= len(dl)
	avg_acc /= len(dl)

	return avg_loss, avg_acc

train_losses, train_accs = [], []
val_losses, val_accs = [], []
for epoch in range(5):
	print(f'Epoch {epoch+1}')
	t_loss, t_accuracy = train(train_dl)
	v_loss, v_accuracy = test(val_dl)
	train_losses.append(t_loss)
	train_accs.append(t_accuracy)
	val_losses.append(v_loss)
	val_accs.append(v_accuracy)
	print(f'Training Loss: {t_loss}')
	print(f'Training Accuracy: {t_accuracy}')
	print(f'Validation Loss: {v_loss}')
	print(f'Validation Accuracy : {v_accuracy}')

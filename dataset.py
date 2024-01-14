import os
import numpy as np
import torch.utils.data as dutils
from tqdm import tqdm

TRAIN_SPLIT = 0.8

print('Loading the dataset into memory')
b_paths = os.listdir('dataset')

dataset = np.empty((len(b_paths)*100, 373), dtype='float32')

idx = 0
for b_path in tqdm(b_paths):
	b = np.load(f'dataset/{b_path}')
	dataset[idx:idx+100] = b
	idx += 100

print(f'Finished loading the dataset, found {len(dataset)} items')

class Dataset(dutils.Dataset):
	def __init__(self, subset='training'):
		super().__init__()

		self.subset = subset

		val_split = (1 - TRAIN_SPLIT) / 2

		self.num_train = int(len(dataset) * TRAIN_SPLIT)
		self.num_val = int(len(dataset) * val_split)

		if subset == 'training':
			self.num_items = self.num_train
		elif subset == 'validation':
			self.num_items = self.num_val
		elif subset == 'testing':
			self.num_items = len(dataset) - self.num_train - self.num_val
		else:
			self.num_items = len(dataset)
			print('Warning: Unknown subset, using entire dataset')

		print(f'Using {self.num_items} items for {subset}')
	
	def __len__(self):
		return self.num_items
	
	def __getitem__(self, idx):
		offset = 0
		if self.subset == 'validation':
			offset += self.num_train
		if self.subset == 'testing':
			offset += self.num_train + self.num_val
		example = dataset[offset + idx]
		inputs = example[:-1]
		label = example[-1]
		return inputs, label

train_ds = Dataset(subset='training')
val_ds = Dataset(subset='validation')
test_ds = Dataset(subset='testing')

train_dl = dutils.DataLoader(train_ds, batch_size=256, shuffle=True)
val_dl = dutils.DataLoader(val_ds, batch_size=256, shuffle=True)
test_dl = dutils.DataLoader(test_ds, batch_size=256, shuffle=True)

if __name__ == '__main__':
	inputs, targets = next(iter(test_dl))

	print(inputs)
	print(targets)
	print(inputs.shape)
	print(targets.shape)
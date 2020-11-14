# Read from waymo dataset
import os
import tensorflow.compat.v1 as tf
import math
import numpy as np
import itertools

# tf.enable_eager_execution()

from waymo_open_dataset.utils import range_image_utils
from waymo_open_dataset.utils import transform_utils
from waymo_open_dataset.utils import  frame_utils
from waymo_open_dataset import dataset_pb2 as open_dataset

FILENAME = './data/frames'
print('Is file: {}'.format(os.path.isfile(FILENAME)))

dataset = tf.data.TFRecordDataset(FILENAME, compression_type='')
for data in dataset:
    frame = open_dataset.Frame()
    frame.ParseFromString(bytearray(data.numpy()))
    print('found a frame')

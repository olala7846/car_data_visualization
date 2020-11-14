# Read from waymo dataset
import os
import tensorflow.compat.v1 as tf
import math
import numpy as np
import itertools
import open3d

# tf.enable_eager_execution()

from waymo_open_dataset.utils import range_image_utils
from waymo_open_dataset.utils import transform_utils
from waymo_open_dataset.utils import  frame_utils
from waymo_open_dataset import dataset_pb2 as open_dataset

FILENAME = './data/frames'
OUT_DIR = './out'

def main():
  """Main process function"""
  dataset = tf.data.TFRecordDataset(FILENAME, compression_type='')
  frame_proto = sample_single_frame(dataset)
  frame = Frame(frame_proto, 1)

  frame.get_range_data()


def sample_single_frame(dataset):
  for data in dataset:
      frame = open_dataset.Frame()
      frame.ParseFromString(bytearray(data.numpy()))
      return frame

class Frame():
  def __init__(self, frame, frame_id):
    self.frame = frame
    self.frame_id = frame_id

  def save_camera_image(self):
    for camer_image in self.frame.images:
      # Convert camera name Enum to string.
      camera_name = open_dataset.CameraName.Name.Name(camer_image.name)
      file_name = '{}/{}.{}.png'.format(
        OUT_DIR, self.frame_id, camera_name)
      # must use mod 'wb' in order to write binary
      with open(file_name, 'wb') as out_file:
        out_file.write(camer_image.image)

  def get_range_data(self):
    # use temp x1, x2, x3 for better formatting
    x1, x2, x3 = frame_utils.parse_range_image_and_camera_projection(self.frame)
    range_images = x1
    camera_projections = x2
    range_image_top_pose = x3

    # cp_points (camera projection points) unused for now
    points, cp_points = frame_utils.convert_range_image_to_point_cloud(
      self.frame,
      range_images,
      camera_projections,
      range_image_top_pose)
    points_ri2, cp_points_ri2 = frame_utils.convert_range_image_to_point_cloud(
      self.frame,
      range_images,
      camera_projections,
      range_image_top_pose,
      ri_index=1)
    # points is an array of size 5 (different cameras)
    for camera_id, camera_points in enumerate(points):
      file_name = '{}/lidar{}.pcd'.format(OUT_DIR, camera_id)
      points_np = np.asarray(camera_points)
      point_cloud = open3d.geometry.PointCloud()
      point_cloud.points = open3d.utility.Vector3dVector(points_np)
      # TODO(hcchao): Init PointCloud directly with vectors?
      open3d.io.write_point_cloud(file_name, point_cloud, print_progress=True)


if __name__ == "__main__":
  main()

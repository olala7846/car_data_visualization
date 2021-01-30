# Read from waymo dataset
import os
import tensorflow.compat.v1 as tf
import math
import numpy as np
import itertools
import open3d
import json

# tf.enable_eager_execution()

from waymo_open_dataset.utils import range_image_utils
from waymo_open_dataset.utils import transform_utils
from waymo_open_dataset.utils import  frame_utils
from waymo_open_dataset import dataset_pb2 as open_dataset
from waymo_open_dataset.label_pb2 import Label

# FILENAME = './data/frames'
FILENAME = './data/multiple_frames.tfrecord'
OUT_DIR = './out'
POINT_CLOUD_COLOR = np.array([1.0, 1.0, 1.0])

def main():
  """Main process function"""
  dataset = tf.data.TFRecordDataset(FILENAME, compression_type='')
  frame_proto = sample_single_frame(dataset)
  frame = Frame(frame_proto)

  frame.save_camera_image()


def sample_single_frame(dataset):
  for data in dataset:
      frame = open_dataset.Frame()
      frame.ParseFromString(bytearray(data.numpy()))
      return frame

class Frame():
  def __init__(self, frame_proto):
    # sort lasers according to name
    frame_proto.lasers.sort(key=lambda laser: laser.name)
    self.frame = frame_proto
    self.frame_id = frame_proto.context.name

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
    laser_names = [laser.name for laser in self.frame.lasers]
    # points is an array of size 5 (different cameras)
    for laser_name, camera_points in zip(laser_names, points):
      file_name = '{}/laser_{}.pcd'.format(
        OUT_DIR, open_dataset.LaserName.Name.Name(laser_name))
      points_np = np.asarray(camera_points)
      points = open3d.utility.Vector3dVector(points_np)
      point_cloud = open3d.geometry.PointCloud(points)
      point_cloud.paint_uniform_color(POINT_CLOUD_COLOR)
      open3d.io.write_point_cloud(file_name, point_cloud, print_progress=True)

  def get_data_json(self):
    data = dict()

    # Camera calibration
    context = self.frame.context
    frustrums = list()
    for camera in context.camera_calibrations:
      camera_name = open_dataset.CameraName.Name.Name(camera.name)
      frustrums.append({
        'name': camera_name,
        'intrinsic': [f for f in camera.intrinsic],
        'extrinsic': [t for t in camera.extrinsic.transform],
      })
    data['frustrums'] = frustrums

    labels = list()
    for label in self.frame.laser_labels:
      labels.append({
        'centerX': label.box.center_x,
        'centerY': label.box.center_y,
        'centerZ': label.box.center_z,
        'length': label.box.length,
        'width': label.box.width,
        'height': label.box.height,
        'heading': label.box.heading,
        'type': Label.Type.Name(label.type),
      })

    # 3D labels
    data['labels'] = labels
    file_name = '{}/{}.data.json'.format(OUT_DIR, self.frame_id)
    with open(file_name, 'w') as outfile:
      json.dump(data, outfile)

if __name__ == "__main__":
  main()

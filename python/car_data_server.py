from car_data_service_pb2 import SingleFrame
from concurrent import futures

import car_data_service_pb2_grpc
import grpc


class CarDataServicer(car_data_service_pb2_grpc.CarDataServiceServicer):

  def ListFrames(self, request, context):
    for i in range(10):
      frame = SingleFrame()
      frame.frame_id = i
      yield frame

def serve():
  server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
  car_data_service_pb2_grpc.add_CarDataServiceServicer_to_server(
      CarDataServicer(), server)
  server.add_insecure_port('[::]:50051')
  server.start()
  server.wait_for_termination()

if __name__ == "__main__":
  serve()

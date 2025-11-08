import os
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
from rest_framework.views import APIView
from rest_framework.response import Response

producer = None

def get_producer():
    global producer
    if producer is None:
        try:
            producer = KafkaProducer(
                bootstrap_servers=os.getenv("KAFKA_BROKER", "kafka:9092"),
                retries=5,
                linger_ms=10,
                max_in_flight_requests_per_connection=1,
            )
        except NoBrokersAvailable:
            producer = None
    return producer


class AnalyzeImage(APIView):
    def post(self, request):
        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"error": "No image uploaded"}, status=400)

        image_bytes = image_file.read()
        kafka_producer = get_producer()

        if kafka_producer is None:
            return Response({"error": "Kafka broker not available"}, status=503)

        kafka_producer.send("images", value=image_bytes)
        kafka_producer.flush()

        return Response({"message": "Image sent to Kafka"})

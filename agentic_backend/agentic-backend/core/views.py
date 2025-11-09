import os
import json
import time
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable
from rest_framework.views import APIView
from rest_framework.response import Response
import base64

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
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            )
        except NoBrokersAvailable:
            producer = None
    return producer


class AnalyzeImage(APIView):
    def post(self, request):
        image_file = request.FILES.get("image")
        location = request.data.get("location", "Unknown Location")
        organization_id = request.data.get("organization_id", None)
        if not image_file:
            return Response({"error": "No image uploaded"}, status=400)
        
        if not organization_id:
            return Response({"error": "No organizaiton id sent"}, status=400)

        # Convert image to base64 (so JSON can handle it)
        image_bytes = base64.b64encode(image_file.read()).decode('utf-8')

        kafka_producer = get_producer()
        if kafka_producer is None:
            return Response({"error": "Kafka broker not available"}, status=503)

        message = {
            "image": image_bytes,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "location": location,
            "organization_id": organization_id
        }

        kafka_producer.send("images", value=message)
        kafka_producer.flush()

        return Response({"message": "Image sent to Kafka", "metadata": message})

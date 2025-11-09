"""
Kafka Consumer Service - Reads images from Kafka and invokes security monitoring agent
"""

import os
import json
import logging
from datetime import datetime
from io import BytesIO
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable
from PIL import Image
import time
import base64

# Import your agent
from agent import monitor_security_image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SecurityImageConsumer:
    """Kafka consumer for security image analysis"""
    
    def __init__(
        self,
        kafka_broker=None,
        topic="images",
        group_id="security-monitor-group",
        save_images=True,
        image_dir="./received_images"
    ):
        """
        Initialize the Kafka consumer
        
        Args:
            kafka_broker: Kafka broker address (default from env or 'kafka:9092')
            topic: Kafka topic to consume from
            group_id: Consumer group ID
            save_images: Whether to save images to disk before analysis
            image_dir: Directory to save images
        """
        self.kafka_broker = kafka_broker or os.getenv("KAFKA_BROKER", "kafka:9092")
        self.topic = topic
        self.group_id = group_id
        self.save_images = save_images
        self.image_dir = image_dir
        self.consumer = None
        
        # Create image directory if saving images
        if self.save_images:
            os.makedirs(self.image_dir, exist_ok=True)
        
        # Statistics
        self.messages_processed = 0
        self.incidents_detected = 0
        self.errors = 0
    
    def connect(self, max_retries=5, retry_delay=5):
        """Connect to Kafka broker with retries"""
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting to connect to Kafka at {self.kafka_broker} (attempt {attempt + 1}/{max_retries})")
                
                self.consumer = KafkaConsumer(
                    self.topic,
                    bootstrap_servers=self.kafka_broker,
                    group_id=self.group_id,
                    auto_offset_reset='earliest',  # Start from beginning if no offset
                    enable_auto_commit=True,
                    value_deserializer=lambda m: m,  # Keep as bytes
                    # consumer_timeout_ms removed - will wait indefinitely for messages
                )
                
                logger.info(f"Successfully connected to Kafka at {self.kafka_broker}")
                logger.info(f"Subscribed to topic: {self.topic}")
                return True
                
            except NoBrokersAvailable:
                logger.warning(f"Kafka broker not available. Retrying in {retry_delay} seconds...")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    logger.error("Failed to connect to Kafka after maximum retries")
                    return False
            except Exception as e:
                logger.error(f"Error connecting to Kafka: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    return False
        
        return False
    
    def process_image(self, image_bytes, timestamp=None, location=None, organization_id=None):
        """
        Process a single image through the security agent
        
        Args:
            image_bytes: Raw image bytes from Kafka
            timestamp: Optional timestamp string
            location: Optional location string
        
        Returns:
            dict: Analysis results from the agent
        """
        try:
            # Generate timestamp if not provided
            if timestamp is None:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Save image to temporary file
            if self.save_images:
                image_filename = f"image_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
                image_path = os.path.join(self.image_dir, image_filename)
            else:
                # Create temporary file
                image_path = f"/tmp/temp_image_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
            
            # Convert bytes to image and save
            image = Image.open(BytesIO(image_bytes))
            if image.mode in ("RGBA", "LA"):
                background = Image.new("RGB", image.size, (255, 255, 255))  # white background
                background.paste(image, mask=image.split()[-1])  # paste using alpha channel as mask
                image = background
            else:
                image = image.convert("RGB")
            image.save(image_path, format="JPEG")

            logger.info(f"Processing image: {image_path}")
            
            # Invoke the security monitoring agent
            result = monitor_security_image(
                image_path=image_path,
                timestamp=timestamp,
                location=location or "Kafka Stream",
                organization_id=organization_id
            )
            
            # Clean up temporary file if not saving
            if not self.save_images:
                try:
                    os.remove(image_path)
                except:
                    pass
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {
                "error": str(e),
                "timestamp": timestamp,
                "analysis_complete": False
            }
    
    def handle_analysis_result(self, result):
        """
        Handle the analysis result (log, alert, store, etc.)
        
        Args:
            result: Analysis result from the agent
        """
        try:
            if result.get("error"):
                logger.error(f"Analysis error: {result['error']}")
                self.errors += 1
                return
            
            if result.get("is_problem"):
                self.incidents_detected += 1
                severity = result.get("severity", "unknown")
                incident_type = result.get("incident_type", "unknown")
                
                # Log incident
                logger.warning(f"🚨 INCIDENT DETECTED: {incident_type} - Severity: {severity}")
                logger.warning(f"   Description: {result.get('description', 'N/A')}")
                logger.warning(f"   Action: {result.get('recommended_action', 'N/A')}")
                
                # For critical/high severity, you might want to:
                if severity in ["critical", "high"]:
                    # 1. Send alert via email/SMS/webhook
                    self.send_alert(result)
                    
                    # 2. Store in database
                    self.store_incident(result)
                    
                    # 3. Trigger automated response
                    self.trigger_response(result)
            else:
                logger.info(f"✓ No issues detected - {result.get('incident_type', 'normal')}")
            
            self.messages_processed += 1
            
        except Exception as e:
            logger.error(f"Error handling analysis result: {e}")
    
    def send_alert(self, result):
        """Send alert for critical incidents (implement your alert mechanism)"""
        # TODO: Implement your alerting logic
        # Examples:
        # - Send email via SMTP
        # - Send SMS via Twilio
        # - Post to Slack/Discord webhook
        # - Push notification
        logger.info(f"[ALERT] Sending alert for {result['incident_type']}")
        pass
    
    def store_incident(self, result):
        """Store incident in database (implement your storage logic)"""
        # TODO: Implement your database storage
        # Examples:
        # - PostgreSQL
        # - MongoDB
        # - Elasticsearch
        logger.info(f"[STORAGE] Storing incident: {result['incident_type']}")
        pass
    
    def trigger_response(self, result):
        """Trigger automated response (implement your response logic)"""
        # TODO: Implement automated response
        # Examples:
        # - Activate alarm system
        # - Lock/unlock doors
        # - Call emergency services
        # - Notify security personnel
        logger.info(f"[RESPONSE] Triggering response for: {result['incident_type']}")
        pass
    
    def consume(self):
        """Main consumer loop - continuously process messages from Kafka"""
        if self.consumer is None:
            logger.error("Consumer not connected. Call connect() first.")
            return
        
        logger.info(f"🔄 Starting to consume messages from topic: {self.topic}")
        logger.info("Press Ctrl+C to stop...")
        
        try:
            for message in self.consumer:
                try:
                    logger.info(f"\n{'='*60}")
                    logger.info(f"Received message - Partition: {message.partition}, Offset: {message.offset}")
                    
                    # Extract image bytes
                    try:
                        data = json.loads(message.value.decode("utf-8"))
                        image_bytes = base64.b64decode(data["image"])
                        timestamp = data.get("timestamp")
                        location = data.get("location")
                    except Exception as e:
                        logger.error(f"Failed to parse message: {e}")
                        self.errors += 1
                        continue
                    
                    # Process the image
                    result = self.process_image(
                        image_bytes=image_bytes,
                        timestamp=timestamp,
                        location=location
                    )
                    
                    # Handle the result
                    self.handle_analysis_result(result)
                    
                    # Print statistics
                    logger.info(f"Statistics - Processed: {self.messages_processed}, "
                              f"Incidents: {self.incidents_detected}, Errors: {self.errors}")
                    logger.info(f"{'='*60}\n")
                    
                except Exception as e:
                    logger.error(f"Error processing Kafka message: {e}")
                    self.errors += 1
                    continue
        
        except KeyboardInterrupt:
            logger.info("\n🛑 Shutting down consumer...")
        
        finally:
            self.close()
    
    def close(self):
        """Close the consumer connection"""
        if self.consumer:
            logger.info("Closing Kafka consumer...")
            self.consumer.close()
            logger.info("✓ Consumer closed")
            
            # Print final statistics
            logger.info(f"\n{'='*60}")
            logger.info("FINAL STATISTICS")
            logger.info(f"{'='*60}")
            logger.info(f"Total messages processed: {self.messages_processed}")
            logger.info(f"Total incidents detected: {self.incidents_detected}")
            logger.info(f"Total errors: {self.errors}")
            logger.info(f"{'='*60}\n")


def main():
    """Main entry point for the consumer service"""
    # Configuration from environment variables
    # Use kafka:9092 for Docker, localhost:29092 for local development
    default_broker = "kafka:9092" if os.path.exists("/.dockerenv") else "localhost:29092"
    kafka_broker = os.getenv("KAFKA_BROKER", default_broker)
    topic = os.getenv("KAFKA_TOPIC", "images")
    group_id = os.getenv("KAFKA_GROUP_ID", "security-monitor-group")
    save_images = os.getenv("SAVE_IMAGES", "true").lower() == "true"
    image_dir = os.getenv("IMAGE_DIR", "./received_images")
    
    logger.info("Starting Security Image Consumer Service")
    logger.info(f"Configuration:")
    logger.info(f"  Kafka Broker: {kafka_broker}")
    logger.info(f"  Topic: {topic}")
    logger.info(f"  Group ID: {group_id}")
    logger.info(f"  Save Images: {save_images}")
    logger.info(f"  Image Directory: {image_dir}")
    logger.info(f"  Running in: {'Docker' if os.path.exists('/.dockerenv') else 'Local'}")
    
    # Create consumer
    consumer = SecurityImageConsumer(
        kafka_broker=kafka_broker,
        topic=topic,
        group_id=group_id,
        save_images=save_images,
        image_dir=image_dir
    )
    
    # Connect to Kafka
    if consumer.connect():
        # Start consuming messages
        consumer.consume()
    else:
        logger.error("Failed to connect to Kafka. Exiting.")


if __name__ == "__main__":
    main()
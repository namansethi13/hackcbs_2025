"""
LangGraph Security Monitoring Agent - Analyzes live event images for incidents
"""

from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from PIL import Image
import json
from datetime import datetime
import base64
import io
import os



class SecurityIncidentState(TypedDict):
    """State for the security monitoring agent"""
    # Inputs
    image_path: str  # Path to image file or base64 string
    timestamp: str  # Time of the incident
    location: str | None  # Optional: location/camera ID
    
    # Analysis outputs
    is_problem: bool | None  # True if any issue detected
    incident_type: str | None  # Type of incident detected
    severity: Literal["low", "medium", "high", "critical"] | None  # Urgency level
    confidence: float | None  # AI confidence score (0-1)
    description: str | None  # Brief description of what's detected
    recommended_action: str | None  # Suggested response
    people_count: int | None  # Approximate number of people visible
    
    # Processing flags
    analysis_complete: bool
    error: str | None


def encode_image_to_base64(image_path: str) -> str:
    """Convert image to base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def load_and_validate_image(state: SecurityIncidentState) -> SecurityIncidentState:
    """Load and validate the image file"""
    try:
        # Try to load as file path
        if state["image_path"].startswith("data:image") or state["image_path"].startswith("base64,"):
            # Handle base64 encoded image
            print("✓ Loading base64 encoded image")
            return state
        else:
            # Load from file path
            image = Image.open(state["image_path"])
            print(f"✓ Image loaded successfully: {state['image_path']}")
            print(f"  Size: {image.size}, Mode: {image.mode}")
            return state
            
    except Exception as e:
        return {
            **state,
            "error": f"Failed to load image: {str(e)}",
            "analysis_complete": True,
            "is_problem": None
        }


def analyze_security_incident(state: SecurityIncidentState) -> SecurityIncidentState:
    """Analyze image using Gemini for security incidents"""
    try:
        # Initialize Gemini model (using Flash for speed in real-time monitoring)
        model = ChatGoogleGenerativeAI(
            model=os.getenv("LLM_MODEL", "gemini-2.0-flash-exp"),
            temperature=0.3
        )
        
        # Encode image to base64
        image_data = encode_image_to_base64(state["image_path"])
        
        # Comprehensive security analysis prompt
        prompt = f"""You are a security monitoring AI assistant analyzing live surveillance footage.

**Context:**
- Timestamp: {state['timestamp']}
- Location: {state.get('location', 'Unknown')}

**Your Task:**
Analyze this image for ANY security concerns, safety hazards, or incidents that require attention.

**Incidents to detect (but not limited to):**
- Fire/Smoke (any signs of flames, smoke, or burning)
- Fighting/Violence (physical altercations, aggressive behavior)
- Stampede/Crowd Crush (dangerous crowd density or movement)
- Medical Emergency (person collapsed, injured, distressed)
- Suspicious Activity (unattended packages, unusual behavior)
- Unauthorized Access (people in restricted areas)
- Vandalism/Property Damage
- Weapons/Dangerous Objects
- Slip/Trip/Fall Hazards
- Overcrowding (exceeding safe capacity)
- Missing/Lost Person (child alone, distressed individual)
- Natural Hazards (flooding, structural damage)

**Response Format:**
Provide your analysis in JSON format with these fields:

{{
  "is_problem": boolean,  // true if ANY issue detected, false if everything appears normal
  "incident_type": string,  // One of: "fire", "fight", "stampede", "medical_emergency", "suspicious_activity", 
                            // "unauthorized_access", "vandalism", "weapon_detected", "hazard", "overcrowding", 
                            // "lost_person", "natural_hazard", "normal", "other"
  "severity": string,  // "low" (minor, no immediate danger), "medium" (requires monitoring/response), 
                      // "high" (urgent response needed), "critical" (immediate emergency response)
  "confidence": float,  // 0.0 to 1.0 - how confident are you in this assessment
  "description": string,  // Clear, concise description of what you see (2-3 sentences max)
  "recommended_action": string,  // Specific action security should take
  "people_count": number,  // Approximate count of people visible (0 if none)
  "additional_concerns": [list of strings]  // Any other notable observations
}}

**Important Guidelines:**
- Be accurate but cautious - false alarms are better than missed incidents
- If image quality is poor, indicate lower confidence
- If nothing is wrong, mark is_problem as false and incident_type as "normal"
- Focus on actionable information for security personnel
- Consider context: time of day, location type, normal vs abnormal behavior

Return ONLY valid JSON, no markdown formatting or extra text."""

        # Create message with image
        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": f"data:image/jpeg;base64,{image_data}"
                }
            ]
        )
        
        # Generate response
        response = model.invoke([message])
        response_text = response.content.strip()
        
        # Clean up response (remove markdown if present)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON response
        result = json.loads(response_text)
        
        # Log analysis results
        print(f"\n{'='*60}")
        print(f"SECURITY ANALYSIS - {state['timestamp']}")
        print(f"{'='*60}")
        print(f"Status: {'⚠️  INCIDENT DETECTED' if result['is_problem'] else '✓ All Clear'}")
        print(f"Incident Type: {result['incident_type']}")
        print(f"Severity: {result['severity']}")
        print(f"Confidence: {result['confidence']:.0%}")
        print(f"People Count: {result.get('people_count', 'N/A')}")
        print(f"\nDescription: {result['description']}")
        print(f"\nRecommended Action: {result['recommended_action']}")
        
        if result.get('additional_concerns'):
            print(f"\nAdditional Concerns:")
            for concern in result['additional_concerns']:
                print(f"  - {concern}")
        print(f"{'='*60}\n")
        
        return {
            **state,
            "is_problem": result["is_problem"],
            "incident_type": result["incident_type"],
            "severity": result["severity"],
            "confidence": result.get("confidence", 0.0),
            "description": result["description"],
            "recommended_action": result["recommended_action"],
            "people_count": result.get("people_count"),
            "analysis_complete": True,
            "error": None
        }
        
    except json.JSONDecodeError as e:
        return {
            **state,
            "error": f"Failed to parse AI response: {str(e)}. Response was: {response_text[:200]}",
            "analysis_complete": True
        }
    except Exception as e:
        return {
            **state,
            "error": f"Analysis failed: {str(e)}",
            "analysis_complete": True
        }


def route_after_validation(state: SecurityIncidentState) -> str:
    """Route based on image validation"""
    if state.get("error"):
        return END
    return "analyze"


def create_security_monitoring_agent():
    """Create and compile the LangGraph security monitoring workflow"""
    
    # Create the graph
    workflow = StateGraph(SecurityIncidentState)
    
    # Add nodes
    workflow.add_node("load_image", load_and_validate_image)
    workflow.add_node("analyze", analyze_security_incident)
    
    # Define edges
    workflow.set_entry_point("load_image")
    workflow.add_conditional_edges(
        "load_image",
        route_after_validation,
        {
            "analyze": "analyze",
            END: END
        }
    )
    workflow.add_edge("analyze", END)
    
    # Compile the graph
    return workflow.compile()


# Convenience function to run the agent
def monitor_security_image(
    image_path: str,
    timestamp: str = None,
    location: str = None
) -> dict:
    """
    Run security monitoring on a single image
    
    Args:
        image_path: Path to image file or base64 string
        timestamp: Time of capture (defaults to current time)
        location: Optional location/camera identifier
    
    Returns:
        Dictionary with analysis results
    """
    if timestamp is None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Create agent
    agent = create_security_monitoring_agent()
    
    # Initial state
    initial_state = {
        "image_path": image_path,
        "timestamp": timestamp,
        "location": location,
        "is_problem": None,
        "incident_type": None,
        "severity": None,
        "confidence": None,
        "description": None,
        "recommended_action": None,
        "people_count": None,
        "analysis_complete": False,
        "error": None
    }
    
    # Run the agent
    result = agent.invoke(initial_state)
    print("got the following result")
    print(result)
    return result


# Example usage
if __name__ == "__main__":
    # Example 1: Single image analysis
    result = monitor_security_image(
        image_path="fire.jpg",
        timestamp="2025-11-08 14:30:45",
        location="Main Entrance - Camera 1"
    )
    
    # Check if incident detected
    if result["is_problem"]:
        print(f"🚨 ALERT: {result['incident_type']} - {result['severity']} severity")
        print(f"Action: {result['recommended_action']}")
    else:
        print(result)
        print("✓ No issues detected")
    
    # Example 2: Continuous monitoring simulation
    # print("\n" + "="*60)
    # print("CONTINUOUS MONITORING SIMULATION")
    # print("="*60 + "\n")
    
    # camera_feeds = [
    #     ("camera1.jpg", "2025-11-08 14:30:00", "Main Hall"),
    #     ("camera2.jpg", "2025-11-08 14:30:05", "Exit Gate"),
    #     ("camera3.jpg", "2025-11-08 14:30:10", "Parking Lot"),
    # ]
    
    # for img_path, time, loc in camera_feeds:
    #     try:
    #         result = monitor_security_image(img_path, time, loc)
            
    #         # Log to file or database in production
    #         if result["is_problem"] and result["severity"] in ["high", "critical"]:
    #             # Trigger immediate alert
    #             print(f"🚨 IMMEDIATE ATTENTION REQUIRED: {loc}")
    #     except Exception as e:
    #         print(f"Error processing {loc}: {e}")
"""
LangGraph Security Monitoring Agent - Analyzes live event images for incidents
With automated Firebase incident management using tool calling
"""

from typing import TypedDict, Literal, Annotated
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from PIL import Image
import json
from datetime import datetime
import base64
import io
import os
from .firebase_tools import fetch_all_incidents, find_incident, report_incident, mark_incident_fixed


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
    
    # Firebase management
    existing_incidents: list | None  # All existing incidents from Firebase
    incident_reported: bool  # Whether incident was reported to Firebase
    incident_resolved: bool  # Whether incident was marked as resolved
    firebase_doc_id: str | None  # Document ID in Firebase
    
    # Processing flags
    analysis_complete: bool
    firebase_complete: bool
    error: str | None
    messages: Annotated[list, "messages"]  # For tool calling


# Define tools for the agent
@tool
def get_all_incidents() -> dict:
    """Fetch all incidents from Firebase to check for existing reports."""
    return fetch_all_incidents()


@tool
def search_incident(timestamp: str, location: str, incident_type: str) -> dict:
    """Search for an existing incident matching timestamp, location, and type."""
    return find_incident(timestamp, location, incident_type)


@tool
def create_incident_report(
    timestamp: str,
    location: str,
    incident_type: str,
    severity: str,
    description: str,
    confidence: float,
    people_count: int,
    recommended_action: str
) -> dict:
    """Create a new incident report in Firebase."""
    data = {
        "timestamp": timestamp,
        "location": location,
        "incident_type": incident_type,
        "severity": severity,
        "description": description,
        "confidence": confidence,
        "people_count": people_count,
        "recommended_action": recommended_action,
        "is_fixed": False,
        "reported_at": datetime.now().isoformat()
    }
    return report_incident(data)


@tool
def resolve_incident(doc_id: str) -> dict:
    """Mark an incident as resolved/fixed in Firebase."""
    return mark_incident_fixed(doc_id)


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
        # Initialize Gemini model
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

This is image from live video stream so don't report like 'this image shows' do something like this thing is happening
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
  "is_problem": boolean,
  "incident_type": string,
  "severity": string,
  "confidence": float,
  "description": string,
  "recommended_action": string,
  "people_count": number,
  "additional_concerns": [list of strings]
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
        
        # Clean up response
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
            "messages": state.get("messages", []),
            "error": None
        }
        
    except json.JSONDecodeError as e:
        return {
            **state,
            "error": f"Failed to parse AI response: {str(e)}",
            "analysis_complete": True
        }
    except Exception as e:
        return {
            **state,
            "error": f"Analysis failed: {str(e)}",
            "analysis_complete": True
        }


def manage_firebase_incidents(state: SecurityIncidentState) -> SecurityIncidentState:
    """
    Use AI agent with tool calling to automatically manage incidents in Firebase:
    1. Fetch all existing incidents
    2. Check if current incident already exists
    3. Report new incidents
    4. Resolve incidents that are now clear
    """
    try:
        # Initialize model with tools
        model = ChatGoogleGenerativeAI(
            model=os.getenv("LLM_MODEL", "gemini-2.0-flash-exp"),
            temperature=0
        ).bind_tools([
            get_all_incidents,
            search_incident,
            create_incident_report,
            resolve_incident
        ])
        
        # Create decision-making prompt
        decision_prompt = f"""You are an automated incident management system. Based on the security analysis, manage incidents in Firebase.

**Current Analysis:**
- Timestamp: {state['timestamp']}
- Location: {state.get('location', 'Unknown')}
- Problem Detected: {state['is_problem']}
- Incident Type: {state['incident_type']}
- Severity: {state['severity']}
- Description: {state['description']}
- Confidence: {state['confidence']}
- People Count: {state['people_count']}
- Recommended Action: {state['recommended_action']}

**Your Task:**
1. First, use get_all_incidents() to fetch existing incidents
2. Check if this incident (matching timestamp, location, incident_type) already exists using search_incident()
3. Decision logic:
   - If is_problem=True AND incident doesn't exist: Create new report using create_incident_report()
   - If is_problem=False: Search for any open incidents at this location and resolve them using resolve_incident()
   - If incident exists and is_problem=True: Do nothing (already reported)
   
4. After taking action, respond with a summary of what you did.

Be autonomous - make decisions and use tools without asking for confirmation."""

        messages = [HumanMessage(content=decision_prompt)]
        
        print(f"\n{'='*60}")
        print(f"FIREBASE INCIDENT MANAGEMENT")
        print(f"{'='*60}")
        
        max_iterations = 10
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            response = model.invoke(messages)
            messages.append(response)
            
            # Check if the model wants to use tools
            if not response.tool_calls:
                # No more tool calls, agent is done
                print(f"\n✓ Agent Decision: {response.content}")
                break
            
            # Execute tool calls
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                
                print(f"\n🔧 Executing: {tool_name}")
                print(f"   Args: {tool_args}")
                
                # Execute the tool
                if tool_name == "get_all_incidents":
                    tool_result = get_all_incidents.invoke({})
                elif tool_name == "search_incident":
                    tool_result = search_incident.invoke(tool_args)
                elif tool_name == "create_incident_report":
                    tool_result = create_incident_report.invoke(tool_args)
                elif tool_name == "resolve_incident":
                    tool_result = resolve_incident.invoke(tool_args)
                else:
                    tool_result = {"error": f"Unknown tool: {tool_name}"}
                
                print(f"   Result: {tool_result}")
                
                # Add tool result to messages
                messages.append(
                    ToolMessage(
                        content=json.dumps(tool_result),
                        tool_call_id=tool_call["id"]
                    )
                )
        
        print(f"{'='*60}\n")
        
        return {
            **state,
            "firebase_complete": True,
            "messages": messages
        }
        
    except Exception as e:
        print(f"❌ Firebase management error: {str(e)}")
        return {
            **state,
            "firebase_complete": True,
            "error": f"Firebase management failed: {str(e)}"
        }


def route_after_validation(state: SecurityIncidentState) -> str:
    """Route based on image validation"""
    if state.get("error"):
        return END
    return "analyze"


def route_after_analysis(state: SecurityIncidentState) -> str:
    """Route based on analysis completion"""
    if state.get("error") or not state.get("analysis_complete"):
        return END
    return "manage_firebase"


def create_security_monitoring_agent():
    """Create and compile the LangGraph security monitoring workflow with Firebase management"""
    
    # Create the graph
    workflow = StateGraph(SecurityIncidentState)
    
    # Add nodes
    workflow.add_node("load_image", load_and_validate_image)
    workflow.add_node("analyze", analyze_security_incident)
    workflow.add_node("manage_firebase", manage_firebase_incidents)
    
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
    
    workflow.add_conditional_edges(
        "analyze",
        route_after_analysis,
        {
            "manage_firebase": "manage_firebase",
            END: END
        }
    )
    
    workflow.add_edge("manage_firebase", END)
    
    # Compile the graph
    return workflow.compile()


# Convenience function to run the agent
def monitor_security_image(
    image_path: str,
    timestamp: str = None,
    location: str = None,
    organization_id: str = None
) -> dict:
    """
    Run security monitoring on a single image with automated Firebase management
    
    Args:
        image_path: Path to image file or base64 string
        timestamp: Time of capture (defaults to current time)
        location: Optional location/camera identifier
        organization_id: this is the id of organizaiton this footage is
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
        "existing_incidents": None,
        "incident_reported": False,
        "incident_resolved": False,
        "firebase_doc_id": None,
        "analysis_complete": False,
        "firebase_complete": False,
        "error": None,
        "messages": []
    }
    
    # Run the agent
    result = agent.invoke(initial_state)
    print("\n✓ Security monitoring complete with Firebase management")
    
    return result


# Example usage
if __name__ == "__main__":
    result = monitor_security_image(
        image_path="fire.jpg",
        timestamp="2025-11-08 14:30:45",
        location="Main Entrance - Camera 1"
    )
    
    # Check results
    if result.get("error"):
        print(f"❌ Error: {result['error']}")
    elif result["is_problem"]:
        print(f"\n🚨 ALERT: {result['incident_type']} - {result['severity']} severity")
        print(f"Action: {result['recommended_action']}")
        print(f"Firebase: {'Reported' if result.get('incident_reported') else 'Already exists or error'}")
    else:
        print(f"\n✓ No issues detected")
        print(f"Firebase: {'Incidents resolved' if result.get('incident_resolved') else 'No action needed'}")
import os
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any

# ---------- INITIALIZATION ----------

def get_db():
    """Initialize Firebase once and return Firestore client."""
    if not firebase_admin._apps:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        cred_path = os.path.join(current_dir, "serviceAccountKey.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()


db = get_db()
INCIDENTS_COLLECTION = "incidents"


# ---------- HELPERS ----------

def _serialize_firestore_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Firestore-native types (like DatetimeWithNanoseconds) to JSON-safe formats."""
    serialized = {}
    for k, v in data.items():
        if hasattr(v, "isoformat"):  # Handles datetime and Firestore timestamps
            serialized[k] = v.isoformat()
        else:
            serialized[k] = v
    return serialized


def _serialize_doc(doc) -> Dict[str, Any]:
    """Convert a Firestore DocumentSnapshot to serializable dict."""
    data = _serialize_firestore_data(doc.to_dict())
    data["_doc_id"] = doc.id
    return data


# ---------- TOOL FUNCTIONS ----------

def fetch_all_incidents() -> dict:
    """Fetch all incident documents from Firestore, JSON-safe."""
    docs = db.collection(INCIDENTS_COLLECTION).stream()
    incidents = [_serialize_doc(doc) for doc in docs]
    return {"count": len(incidents), "incidents": incidents}


def find_incident(timestamp: str, location: str, incident_type: str) -> dict:
    """Find an incident matching timestamp + location + type."""
    coll = db.collection(INCIDENTS_COLLECTION)
    query = (
        coll.where("timestamp", "==", timestamp)
        .where("location", "==", location)
        .where("incident_type", "==", incident_type)
        .limit(1)
    )
    results = list(query.stream())
    if not results:
        return {"found": False}
    doc = results[0]
    return {"found": True, "incident": _serialize_doc(doc)}


def report_incident(data: Dict[str, Any]) -> dict:
    """Create a new incident in Firestore."""
    ref = db.collection(INCIDENTS_COLLECTION).add(data)[1]  # returns (write_result, reference)
    return {"success": True, "doc_id": ref.id}


def mark_incident_fixed(doc_id: str) -> dict:
    """Mark an incident as fixed in Firestore."""
    db.collection(INCIDENTS_COLLECTION).document(doc_id).update(
        {"is_fixed": True, "fixed_at": firestore.SERVER_TIMESTAMP}
    )
    return {"success": True, "doc_id": doc_id, "status": "fixed"}

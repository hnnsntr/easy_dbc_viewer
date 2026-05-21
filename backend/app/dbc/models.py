from pydantic import BaseModel
from typing import List, Optional, Set

class NodeModel(BaseModel):
    id: str
    name: str
    kind: str = "ecu"
    source: List[str]
    txMessageCount: int = 0
    rxMessageCount: int = 0
    txSignalCount: int = 0
    rxSignalCount: int = 0

class SignalModel(BaseModel):
    id: str
    name: str
    messageId: str
    messageName: str
    sender: str
    receivers: List[str]
    startBit: int
    length: int
    byteOrder: str
    isSigned: bool
    scale: float
    offset: float
    minimum: Optional[float]
    maximum: Optional[float]
    unit: Optional[str]
    choices: Optional[dict]
    comment: Optional[str]

class MessageModel(BaseModel):
    id: str
    canId: int
    hexId: str
    name: str
    dlc: int
    sender: str
    cycleTimeMs: Optional[int]
    comment: Optional[str]
    signalIds: List[str]

class EdgeModel(BaseModel):
    id: str
    source: str
    target: str
    messageCount: int
    signalCount: int
    messages: List[str]
    signals: List[str]

class GraphModel(BaseModel):
    nodes: List[NodeModel]
    edges: List[EdgeModel]
    messages: List[MessageModel]
    signals: List[SignalModel]
    metadata: dict

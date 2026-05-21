from typing import List, Dict, Tuple
from .models import NodeModel, MessageModel, SignalModel, EdgeModel, GraphModel

def build_graph(nodes: List[NodeModel], messages: List[MessageModel], signals: List[SignalModel]) -> GraphModel:
    edges_dict: Dict[Tuple[str, str], EdgeModel] = {}
    
    # Create edges from messages and signals
    for message in messages:
        sender = message.sender
        
        message_signals = [s for s in signals if s.messageId == message.id]
        
        for signal in message_signals:
            for receiver in signal.receivers:
                if receiver == sender:
                    continue
                
                edge_key = (sender, receiver)
                if edge_key not in edges_dict:
                    edges_dict[edge_key] = EdgeModel(
                        id=f"{sender}__{receiver}",
                        source=sender,
                        target=receiver,
                        messageCount=0,
                        signalCount=0,
                        messages=[],
                        signals=[]
                    )
                
                edge = edges_dict[edge_key]
                
                if message.id not in edge.messages:
                    edge.messages.append(message.id)
                    edge.messageCount += 1
                    
                if signal.id not in edge.signals:
                    edge.signals.append(signal.id)
                    edge.signalCount += 1
                    
    edges = list(edges_dict.values())
    
    metadata = {
        "nodeCount": len(nodes),
        "messageCount": len(messages),
        "signalCount": len(signals),
        "edgeCount": len(edges)
    }
    
    return GraphModel(
        nodes=nodes,
        edges=edges,
        messages=messages,
        signals=signals,
        metadata=metadata
    )

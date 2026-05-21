import cantools
from .models import NodeModel, MessageModel, SignalModel

def parse_dbc(file_content: str):
    db = cantools.database.load_string(file_content, strict=False)
    
    nodes_dict = {}
    messages = []
    signals = []

    # Initialize nodes from explicitly defined nodes
    for node in (db.nodes or []):
        if node.name != 'Vector__XXX' and node.name not in nodes_dict:
            nodes_dict[node.name] = NodeModel(
                id=node.name,
                name=node.name,
                source=["explicit_node"],
                txMessageCount=0,
                rxMessageCount=0,
                txSignalCount=0,
                rxSignalCount=0
            )

    for message in db.messages:
        sender = message.senders[0] if message.senders and message.senders[0] != 'Vector__XXX' else "Unknown"
        
        # Add inferred sender node
        if sender not in nodes_dict:
            nodes_dict[sender] = NodeModel(
                id=sender,
                name=sender,
                source=["inferred_sender"],
            )
        elif "inferred_sender" not in nodes_dict[sender].source and "explicit_node" not in nodes_dict[sender].source:
            nodes_dict[sender].source.append("inferred_sender")

        nodes_dict[sender].txMessageCount += 1
        
        msg_id = str(message.frame_id)
        msg_model = MessageModel(
            id=msg_id,
            canId=message.frame_id,
            hexId=hex(message.frame_id),
            name=message.name,
            dlc=message.length,
            sender=sender,
            cycleTimeMs=message.cycle_time,
            comment=message.comment,
            signalIds=[]
        )
        
        for signal in (message.signals or []):
            sig_id = f"{message.name}.{signal.name}"
            msg_model.signalIds.append(sig_id)
            nodes_dict[sender].txSignalCount += 1
            
            receivers = [r for r in (signal.receivers or []) if r != 'Vector__XXX']
            
            sig_model = SignalModel(
                id=sig_id,
                name=signal.name,
                messageId=msg_id,
                messageName=message.name,
                sender=sender,
                receivers=receivers,
                startBit=signal.start if signal.start is not None else 0,
                length=signal.length,
                byteOrder=signal.byte_order,
                isSigned=signal.is_signed,
                scale=signal.scale if signal.scale is not None else 1.0,
                offset=signal.offset if signal.offset is not None else 0.0,
                minimum=signal.minimum,
                maximum=signal.maximum,
                unit=signal.unit,
                choices={str(k): str(v) for k, v in signal.choices.items()} if signal.choices else None,
                comment=signal.comment
            )
            signals.append(sig_model)
            
            for rx in receivers:
                if rx not in nodes_dict:
                    nodes_dict[rx] = NodeModel(
                        id=rx,
                        name=rx,
                        source=["inferred_receiver"],
                    )
                elif "inferred_receiver" not in nodes_dict[rx].source and "explicit_node" not in nodes_dict[rx].source:
                    nodes_dict[rx].source.append("inferred_receiver")
                
                nodes_dict[rx].rxSignalCount += 1
                
        messages.append(msg_model)

    # Calculate rxMessageCount based on signals received from messages
    for msg in messages:
        receivers = set()
        for sig in signals:
            if sig.messageId == msg.id:
                for rx in sig.receivers:
                    receivers.add(rx)
        for rx in receivers:
            if rx in nodes_dict:
                nodes_dict[rx].rxMessageCount += 1

    return list(nodes_dict.values()), messages, signals

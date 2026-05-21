export interface NodeModel extends Record<string, unknown> {
  id: string;
  name: string;
  kind: string;
  source: string[];
  txMessageCount: number;
  rxMessageCount: number;
  txSignalCount: number;
  rxSignalCount: number;
}

export interface SignalModel {
  id: string;
  name: string;
  messageId: string;
  messageName: string;
  sender: string;
  receivers: string[];
  startBit: number;
  length: number;
  byteOrder: string;
  isSigned: boolean;
  scale: number;
  offset: number;
  minimum: number | null;
  maximum: number | null;
  unit: string | null;
  choices: Record<string, string> | null;
  comment: string | null;
}

export interface MessageModel {
  id: string;
  canId: number;
  hexId: string;
  name: string;
  dlc: number;
  sender: string;
  cycleTimeMs: number | null;
  comment: string | null;
  signalIds: string[];
}

export interface EdgeModel extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
  messageCount: number;
  signalCount: number;
  messages: string[];
  signals: string[];
}

export interface GraphModel {
  nodes: NodeModel[];
  edges: EdgeModel[];
  messages: MessageModel[];
  signals: SignalModel[];
  metadata: {
    nodeCount: number;
    messageCount: number;
    signalCount: number;
    edgeCount: number;
  };
}

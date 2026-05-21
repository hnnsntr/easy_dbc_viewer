import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export const Inspectors: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const graph = useStore((state) => state.graph);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const selectedEdgeId = useStore((state) => state.selectedEdgeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const setSelectedEdgeId = useStore((state) => state.setSelectedEdgeId);

  if (!graph) return null;

  if (selectedNodeId) {
    const node = graph.nodes.find(n => n.id === selectedNodeId);
    if (!node) return null;

    // Filter messages where sender is this node
    const txMessages = graph.messages.filter(m => m.sender === node.id);
    
    // Filter messages where this node is a receiver of any signal in the message
    const rxMessages = graph.messages.filter(m => 
      graph.signals.some(s => s.messageId === m.id && s.receivers.includes(node.id))
    );

    return (
      <div className={`absolute right-0 top-0 h-full bg-slate-800 border-l border-slate-700 shadow-xl overflow-y-auto z-10 flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full' : 'w-[500px]'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-lg font-bold text-slate-100">ECU: {node.name}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-slate-400 hover:text-white transition-colors" title={isFullscreen ? "Minimize" : "Maximize"}>
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/50 p-2 rounded border border-slate-600/50">
                <div className="text-slate-400 mb-1">TX Messages</div>
                <div className="text-lg text-blue-400 font-medium">{node.txMessageCount}</div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded border border-slate-600/50">
                <div className="text-slate-400 mb-1">RX Messages</div>
                <div className="text-lg text-green-400 font-medium">{node.rxMessageCount}</div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded border border-slate-600/50">
                <div className="text-slate-400 mb-1">TX Signals</div>
                <div className="text-lg text-blue-400 font-medium">{node.txSignalCount}</div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded border border-slate-600/50">
                <div className="text-slate-400 mb-1">RX Signals</div>
                <div className="text-lg text-green-400 font-medium">{node.rxSignalCount}</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              TX Messages ({txMessages.length})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {txMessages.map(msg => {
                const msgSignals = graph.signals.filter(s => s.messageId === msg.id);
                return (
                  <div key={msg.id} className="text-sm bg-slate-900/50 p-3 rounded border border-slate-700/50 flex flex-col">
                    <div className="flex justify-between mb-2">
                      <span className="text-blue-300 font-medium truncate" title={msg.name}>{msg.name}</span>
                      <span className="text-slate-400 text-xs shrink-0">{msg.hexId}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">
                      DLC: {msg.dlc} {msg.cycleTimeMs ? `| Cycle: ${msg.cycleTimeMs}ms` : ''}
                    </div>
                    <div className="space-y-1 mt-1 border-t border-slate-700/50 pt-2">
                      <div className="text-xs text-slate-400 mb-1">Signals:</div>
                      {msgSignals.map(sig => (
                        <div key={sig.id} className="flex flex-col text-xs mt-1.5 border-t border-slate-700/30 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-300 font-medium truncate" title={sig.name}>{sig.name}</span>
                            <span className="text-slate-500 shrink-0">{sig.startBit}|{sig.length}</span>
                          </div>
                          {sig.receivers && sig.receivers.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sig.receivers.map(rx => (
                                <button
                                  key={rx}
                                  onClick={() => setSelectedNodeId(rx)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 hover:bg-blue-700/60 hover:text-white border border-blue-700/40 transition-colors cursor-pointer"
                                  title={`Go to ${rx}`}
                                >
                                  → {rx}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-slate-600 text-[10px] mt-0.5 italic">No receivers defined</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {txMessages.length === 0 && (
                <div className="text-sm text-slate-500 italic">No transmitted messages.</div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              RX Messages ({rxMessages.length})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {rxMessages.map(msg => {
                const msgSignals = graph.signals.filter(s => s.messageId === msg.id && s.receivers.includes(node.id));
                return (
                  <div key={msg.id} className="text-sm bg-slate-900/50 p-3 rounded border border-slate-700/50 flex flex-col">
                    <div className="flex justify-between mb-1">
                      <span className="text-green-300 font-medium truncate" title={msg.name}>{msg.name}</span>
                      <span className="text-slate-400 text-xs shrink-0">{msg.hexId}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1 flex-wrap">
                      From:
                      <button
                        onClick={() => setSelectedNodeId(msg.sender)}
                        className="text-xs px-1.5 py-0.5 rounded bg-green-900/40 text-green-300 hover:bg-green-700/60 hover:text-white border border-green-700/40 transition-colors cursor-pointer font-medium"
                        title={`Go to ${msg.sender}`}
                      >
                        ↑ {msg.sender}
                      </button>
                      <span className="text-slate-600">|</span>
                      DLC: {msg.dlc} {msg.cycleTimeMs ? `| Cycle: ${msg.cycleTimeMs}ms` : ''}
                    </div>
                    <div className="space-y-1 mt-1 border-t border-slate-700/50 pt-2">
                      <div className="text-xs text-slate-400 mb-1">Signals Received:</div>
                      {msgSignals.map(sig => (
                        <div key={sig.id} className="flex flex-col text-xs mt-1.5 border-t border-slate-700/30 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-300 font-medium truncate" title={sig.name}>{sig.name}</span>
                            <span className="text-slate-500 shrink-0">{sig.startBit}|{sig.length}</span>
                          </div>
                          {sig.receivers && sig.receivers.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sig.receivers.filter(r => r !== node.id).map(rx => (
                                <button
                                  key={rx}
                                  onClick={() => setSelectedNodeId(rx)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600/40 transition-colors cursor-pointer"
                                  title={`Go to ${rx}`}
                                >
                                  → {rx}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {rxMessages.length === 0 && (
                <div className="text-sm text-slate-500 italic">No received messages.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (selectedEdgeId) {
    const edge = graph.edges.find(e => e.id === selectedEdgeId);
    if (!edge) return null;

    const messages = graph.messages.filter(m => edge.messages.includes(m.id));

    return (
      <div className={`absolute right-0 top-0 h-full bg-slate-800 border-l border-slate-700 shadow-xl overflow-y-auto z-10 flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full' : 'w-[500px]'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-lg font-bold text-slate-100 truncate pr-2" title={`${edge.source} → ${edge.target}`}>
            {edge.source} → {edge.target}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-slate-400 hover:text-white transition-colors" title={isFullscreen ? "Minimize" : "Maximize"}>
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={() => setSelectedEdgeId(null)} className="text-slate-400 hover:text-white transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Communication Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/50 p-2 rounded border border-slate-600/50">
                <div className="text-slate-400 mb-1">Messages</div>
                <div className="text-lg text-white font-medium">{edge.messageCount}</div>
              </div>
              <div className="bg-slate-700/50 p-2 rounded border border-slate-600/50">
                <div className="text-slate-400 mb-1">Signals</div>
                <div className="text-lg text-white font-medium">{edge.signalCount}</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Messages</h3>
            <div className="space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className="text-sm bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col">
                  <div className="flex justify-between mb-1">
                    <span className="text-blue-300 font-medium truncate" title={msg.name}>{msg.name}</span>
                    <span className="text-slate-400 text-xs shrink-0">{msg.hexId}</span>
                  </div>
                  <div className="text-xs text-slate-500">DLC: {msg.dlc} {msg.cycleTimeMs ? `| Cycle: ${msg.cycleTimeMs}ms` : ''}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return null;
};

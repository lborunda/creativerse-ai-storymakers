import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { StoryOption, TreeNodeData, D3Node, D3Link } from '../types';
import { CloseIcon, PencilIcon, SparklesIcon, ChatBubbleLeftRightIcon } from './icons';
import Loader from './Loader';

interface StoryTreeViewProps {
  isOpen: boolean;
  onClose: () => void;
  allOptions: StoryOption[][];
  selectedIndices: number[];
  initialPrompt: string;
  onSwitchBranch: (pathIndices: number[]) => void;
  onNodeUpdate: (pathIndices: number[], newTitle: string, newBody: string) => Promise<void>;
  onGetFeedback: (pathIndices: number[], newTitle: string, newBody: string) => Promise<void>;
}

const NodeEditor: React.FC<{ 
    node: D3Node, 
    onSave: (title: string, body: string) => void, 
    onGetFeedback: (title: string, body: string) => void,
    onCancel: () => void,
    isUpdating: boolean
}> = ({ node, onSave, onGetFeedback, onCancel, isUpdating }) => {
  const [title, setTitle] = useState(node.data.text);
  const [body, setBody] = useState(node.data.body);

  return (
    <div className="p-3 bg-gray-50 rounded-b-md border-t-2 border-indigo-200 space-y-3">
        <textarea 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="w-full p-1 border rounded bg-white text-sm font-bold"
            rows={1}
        />
        <textarea 
            value={body} 
            onChange={e => setBody(e.target.value)}
            className="w-full p-1 border rounded bg-white text-sm"
            rows={3}
        />
        {node.data.feedback && (
          <div className="p-2 text-xs bg-purple-100 text-purple-800 rounded-md italic">
            <strong>AI Coach:</strong> {node.data.feedback}
          </div>
        )}
        {isUpdating && <Loader message="Updating..." />}
        <div className="flex justify-between items-center space-x-2">
            <button onClick={onCancel} className="text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-200">Cancel</button>
            <div className="flex space-x-2">
                 <button onClick={() => onGetFeedback(title, body)} disabled={isUpdating} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-400">
                    <ChatBubbleLeftRightIcon className="w-3 h-3"/> Feedback
                </button>
                <button onClick={() => onSave(title, body)} disabled={isUpdating} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-teal-500 text-white hover:bg-teal-600 disabled:bg-gray-400">
                    <SparklesIcon className="w-3 h-3"/> Save
                </button>
            </div>
        </div>
    </div>
  )
}


const Node: React.FC<{ 
    node: D3Node; 
    onSwitchBranch: (pathIndices: number[]) => void;
    onNodeUpdate: (pathIndices: number[], newTitle: string, newBody: string) => Promise<void>;
    onGetFeedback: (pathIndices: number[], newTitle: string, newBody: string) => Promise<void>;
    editingNodeId: string | null;
    setEditingNodeId: (id: string | null) => void;
    isUpdating: boolean;
}> = ({ node, onSwitchBranch, onNodeUpdate, onGetFeedback, editingNodeId, setEditingNodeId, isUpdating }) => {
  const isRoot = node.depth === 0;
  const isEditingThisNode = editingNodeId === node.data.id;

  const canSwitch = !node.data.isChosenPath && !isRoot && !isEditingThisNode;
  const canEdit = !isRoot; // Any node except the root can be edited

  const bgColor = node.data.isChosenPath ? 'bg-teal-500' : 'bg-white';
  const textColor = node.data.isChosenPath ? 'text-white' : 'text-gray-700';
  const borderColor = isEditingThisNode ? 'border-indigo-500' : (node.data.isChosenPath ? 'border-teal-300' : 'border-gray-300');
  let cursor = 'cursor-default';
  if(canSwitch) cursor = 'cursor-pointer';
  if(canEdit && !isEditingThisNode) cursor = 'cursor-pointer';


  const handleNodeClick = () => {
    if (isEditingThisNode) return;
    
    if (canEdit) {
      setEditingNodeId(node.data.id);
    }
  };

  const handleSwitchClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node click from firing
    if (canSwitch) {
      if (window.confirm('Switch to this story branch? Your current progress from this point will be replaced.')) {
        onSwitchBranch(node.data.pathIndices);
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${node.y}px`,
        top: `${node.x}px`,
        transform: 'translate(-50%, -50%)',
        width: '240px',
        zIndex: isEditingThisNode ? 10 : 1,
      }}
      className={`rounded-lg shadow-lg border-2 transition-all duration-300 ${bgColor} ${borderColor} hover:shadow-xl hover:border-indigo-400`}
      onClick={handleNodeClick}
    >
      <div className={`relative ${cursor}`}>
        <img src={node.data.imageUrl} alt="" className="w-full h-24 object-cover rounded-t-md" />
        <div className={`p-2 text-sm leading-snug ${textColor}`}>
            <p className="font-bold">{node.data.text}</p>
            {!isRoot && <p className="text-xs truncate">{node.data.body}</p>}
        </div>
        {canEdit && !isEditingThisNode && (
            <div className="absolute top-1 right-1 bg-white/70 rounded-full p-1">
                <PencilIcon className="w-4 h-4 text-gray-700" />
            </div>
        )}
        {canSwitch && (
            <button onClick={handleSwitchClick} className="absolute bottom-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                Switch
            </button>
        )}
      </div>
       {isEditingThisNode && (
          <NodeEditor 
            node={node}
            isUpdating={isUpdating}
            onSave={(title, body) => onNodeUpdate(node.data.pathIndices, title, body)}
            onGetFeedback={(title, body) => onGetFeedback(node.data.pathIndices, title, body)}
            onCancel={() => setEditingNodeId(null)}
          />
        )}
    </div>
  );
};

const StoryTreeView: React.FC<StoryTreeViewProps> = ({ isOpen, onClose, allOptions, selectedIndices, initialPrompt, onSwitchBranch, onNodeUpdate, onGetFeedback }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<D3Node[]>([]);
  const [links, setLinks] = useState<D3Link[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isUpdatingNode, setIsUpdatingNode] = useState(false);

  const buildTreeData = useCallback((options: StoryOption[][], indices: number[]) => {
    const rootImage = options[0]?.[0]?.imageUrl || '';
    const root: TreeNodeData = {
      id: 'root',
      text: initialPrompt,
      body: 'The beginning of your adventure.',
      isChosenPath: true,
      children: [],
      pathIndices: [],
      imageUrl: rootImage,
    };

    const nodeMap: { [key: string]: TreeNodeData } = { 'root': root };

    function buildRecursive(parent: TreeNodeData, depth: number) {
      if (depth >= options.length) return;
      
      const roundOptions = options[depth];
      const selectedIndexInRound = indices[depth];

      parent.children = roundOptions.map((option, j) => {
        const path = [...parent.pathIndices, j];
        const id = path.join('-');
        const isChosen = parent.isChosenPath && j === selectedIndexInRound;

        const newNodeData: TreeNodeData = {
          id,
          text: option.title,
          body: option.body,
          isChosenPath: isChosen,
          children: [],
          pathIndices: path,
          imageUrl: option.imageUrl,
          feedback: nodeMap[id]?.feedback // Preserve feedback
        };
        nodeMap[id] = newNodeData;
        if(isChosen) {
            buildRecursive(newNodeData, depth + 1);
        }
        return newNodeData;
      });
    }

    buildRecursive(root, 0);
    return root;
  }, [initialPrompt]);

  useEffect(() => {
    if (!isOpen) {
      setEditingNodeId(null);
      return;
    };

    const rootData = buildTreeData(allOptions, selectedIndices);
    if (!rootData) return;

    const hierarchy = d3.hierarchy(rootData);
    
    const nodeHeight = 220;
    const nodeWidth = 280;
    
    let maxNodesInLevel = 0;
    hierarchy.each(node => {
        if (!node.parent) return;
        if(node.parent.children) {
            maxNodesInLevel = Math.max(maxNodesInLevel, node.parent.children.length);
        }
    });
    maxNodesInLevel = Math.max(maxNodesInLevel, 1);


    const calculatedTreeHeight = maxNodesInLevel * hierarchy.height * (nodeHeight / 2) + 200;
    const calculatedTreeWidth = (hierarchy.height + 1) * nodeWidth;
    
    setDimensions({ width: calculatedTreeWidth, height: calculatedTreeHeight });

    const treeLayout = d3.tree<TreeNodeData>().size([calculatedTreeHeight, calculatedTreeWidth]);
    const treeData = treeLayout(hierarchy);

    setNodes(treeData.descendants());
    setLinks(treeData.links());
    
  }, [isOpen, allOptions, selectedIndices, buildTreeData]);

  const handleNodeUpdate = async (pathIndices: number[], newTitle: string, newBody: string) => {
    setIsUpdatingNode(true);
    await onNodeUpdate(pathIndices, newTitle, newBody);
    setIsUpdatingNode(false);
    setEditingNodeId(null);
  }

  const handleGetFeedback = async (pathIndices: number[], newTitle: string, newBody: string) => {
      setIsUpdatingNode(true);
      await onGetFeedback(pathIndices, newTitle, newBody);
      setIsUpdatingNode(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col" onClick={onClose}>
        <div className="bg-white/10 backdrop-blur-sm p-3 text-white text-center">
            <h2 className="text-xl font-bold">Story Workshop</h2>
            <p className="text-sm">Click any chapter to edit text, get writing feedback, or regenerate its image.</p>
        </div>
      <button onClick={onClose} className="fixed top-4 right-4 text-white bg-red-600 rounded-full p-2 z-50 hover:bg-red-700 transition">
        <CloseIcon className="w-8 h-8"/>
      </button>
      <div className="w-full h-full overflow-auto" onClick={e => e.stopPropagation()}>
         <div style={{ width: dimensions.width, height: dimensions.height, position: 'relative' }} className="mx-auto my-12 p-4">
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} style={{ position: 'absolute' }}>
              <g>
                {links.map((link, i) => (
                  <path
                    key={i}
                    d={d3.linkHorizontal<any, D3Node>()
                        .x(d => d.y)
                        .y(d => d.x)
                        (link) || ''}
                    fill="none"
                    stroke={link.target.data.isChosenPath ? '#14b8a6' : '#4b5563'}
                    strokeWidth={link.target.data.isChosenPath ? 3 : 1.5}
                    strokeDasharray={link.target.data.isChosenPath ? "0" : "3,3"}
                  />
                ))}
              </g>
            </svg>
            <div>
              {nodes.map((node, i) => <Node 
                key={node.data.id} 
                node={node} 
                onSwitchBranch={onSwitchBranch} 
                onNodeUpdate={handleNodeUpdate}
                onGetFeedback={handleGetFeedback}
                editingNodeId={editingNodeId}
                setEditingNodeId={setEditingNodeId}
                isUpdating={isUpdatingNode && editingNodeId === node.data.id}
              />)}
            </div>
         </div>
      </div>
    </div>
  );
};

export default StoryTreeView;

import { EvidenceSource } from './evidence';

export type NodeType = 
  | 'file' 
  | 'module' 
  | 'class' 
  | 'function' 
  | 'test' 
  | 'config' 
  | 'decision' 
  | 'commit';

export type EdgeType = 
  | 'imports' 
  | 'calls' 
  | 'extends' 
  | 'implements' 
  | 'tests' 
  | 'configures' 
  | 'co_changed' 
  | 'supersedes'
  | 'defines'
  | 'depends_on'
  | 'modifies';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  filePath: string;
  line?: number;
  description?: string;
  metadata?: {
    signature?: string;
    isExported?: boolean;
    language?: string;
    loc?: number;
    tags?: string[];
  };
  evidence?: EvidenceSource[];
}

export interface GraphEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  type: EdgeType;
  label?: string;
  weight?: number; // e.g. co-change frequency or call count
  evidence?: EvidenceSource[];
}

export interface IndexingStatus {
  status: 'idle' | 'indexing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  filesProcessed?: number;
  totalFiles?: number;
  error?: string;
}

export interface KnowledgeGraph {
  repoId: string;
  repoName: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: string;
  isDemo?: boolean;
  branch?: string;
  commitSha?: string;
  primaryLanguage?: string;
  indexingStatus?: IndexingStatus;
}

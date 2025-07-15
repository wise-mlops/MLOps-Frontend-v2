// composables/workflow-layout.ts
import dagre from '@dagrejs/dagre'
import { type Node, type Edge, Position, useVueFlow } from '@vue-flow/core'
import { ref } from 'vue'

/**
 * Composable to run the layout algorithm on the graph.
 * It uses the `dagre` library to calculate the layout of the nodes and edges.
 */
export const useLayout = () => {
  const { findNode } = useVueFlow()
  const graph = ref(new dagre.graphlib.Graph())
  const previousDirection = ref('LR')
  
  const layout = (nodes: any, edges: any, direction: string) => {
    // we create a new graph instance, in case some nodes/edges were removed, otherwise dagre would act as if they were still there
    const dagreGraph = new dagre.graphlib.Graph()
    graph.value = dagreGraph
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    const isHorizontal = direction === 'LR'
    dagreGraph.setGraph({ rankdir: direction })
    previousDirection.value = direction
    
    for (const node of nodes) {
      // if you need width+height of nodes for your layout, you can use the dimensions property of the internal node (`GraphNode` type)
      const graphNode = findNode(node.id)
      dagreGraph.setNode(node.id, { width: graphNode?.dimensions.width || 150, height: graphNode?.dimensions.height || 50 })
    }
    
    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target)
    }
    
    dagre.layout(dagreGraph)
    
    // set nodes with updated positions
    return nodes.map((node: any) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      }
    })
  }
  
  return { graph, layout, previousDirection }
}

/**
 * Convert KFP (Kubeflow Pipelines) spec to VueFlow workflow format
 */
export function convertKFPToWorkflow(pipelineVersionDetail: any, runDetails: any) {
  const pipelineSpec = pipelineVersionDetail.pipeline_spec?.pipeline_spec;
  if (!pipelineSpec) {
    return createEmptyWorkflow(pipelineVersionDetail, runDetails);
  }
  
  const tasks = pipelineSpec.root?.dag?.tasks;
  if (!tasks) {
    return createEmptyWorkflow(pipelineVersionDetail, runDetails);
  }
  
  const components = pipelineSpec.components;
  const taskDetails = runDetails.run_details.task_details;
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // 태스크 레벨 계산 및 레이아웃 최적화
  const { taskLevels, levelGroups } = calculateOptimizedLayout(tasks);
  
  // 노드 생성
  Object.entries(tasks).forEach(([taskName, task]: [string, any]) => {
    const level = taskLevels[taskName] || 0;
    const levelTasks = levelGroups[level] || [];
    const indexInLevel = levelTasks.indexOf(taskName);
    const totalInLevel = levelTasks.length;

    // 레벨별 명확한 배치 - 간격을 줄임
    const nodeWidth = 280;  // 300 -> 280
    const nodeHeight = 120; // 150 -> 120
    const horizontalSpacing = 50;  // 100 -> 50
    const verticalSpacing = 150;   // 200 -> 150

    // 각 레벨의 노드들을 가로로 균등 배치
    const totalWidth = (totalInLevel * nodeWidth) + ((totalInLevel - 1) * horizontalSpacing);
    const startX = Math.max(50, (1200 - totalWidth) / 2);  // 시작점도 조정

    const position = {
      x: startX + (indexInLevel * (nodeWidth + horizontalSpacing)),
      y: 80 + (level * (nodeHeight + verticalSpacing))  // 시작 y도 조정
    };
    
    // 실행 상태 찾기
    const runTask = findMatchingRunTask(taskDetails, taskName, task);
    
    // 컴포넌트 타입에 따른 노드 타입 및 속성 매핑
    const nodeType = mapComponentToNodeType(task.componentRef.name);
    const attribute = extractAttributeFromTask(task, components[task.componentRef.name]);
    
    const fanIn = {
      count: task.dependentTasks?.length || 0,
      sources: task.dependentTasks || []
    };
    
    const node: Node = {
      id: taskName,
      type: nodeType,
      initialized: false,
      position,
      data: {
        attribute,
        toolbar: {
          position: 'right'
        },
        state: runTask?.state,
        details: runTask
      },
      label: getNodeLabel(task.componentRef.name, taskName),
      fanIn,
      fanOut: {
        count: 0,
        targets: []
      }
    };
    
    nodes.push(node);
  });
  
  // fanOut 계산
  nodes.forEach(node => {
    if (node.fanIn && node.fanIn.sources.length > 0) {
      node.fanIn.sources.forEach(sourceId => {
        const sourceNode = nodes.find(n => n.id === sourceId);
        if (sourceNode && sourceNode.fanOut) {
          sourceNode.fanOut.count++;
          sourceNode.fanOut.targets.push(node.id);
        }
      });
    }
  });
  
  // 엣지 생성
  Object.entries(tasks).forEach(([taskName, task]: [string, any]) => {
    if (task.dependentTasks && Array.isArray(task.dependentTasks)) {
      task.dependentTasks.forEach((depTask: string) => {
        const sourceNode = nodes.find(n => n.id === depTask);
        const targetNode = nodes.find(n => n.id === taskName);

        if (sourceNode && targetNode) {
          const edge: Edge = {
            id: `vueflow__edge-${depTask}__handle-left-${taskName}__handle-right`,
            type: 'default',
            source: depTask,
            target: taskName,
            sourceHandle: '__handle-left',
            targetHandle: '__handle-right',
            data: {},
            label: '',
            sourceX: sourceNode.position.x + 140,  // 150 -> 140 (nodeWidth/2)
            sourceY: sourceNode.position.y + 60,   // 75 -> 60 (nodeHeight/2)
            targetX: targetNode.position.x + 140,
            targetY: targetNode.position.y + 60
          };
          edges.push(edge);
        }
      });
    }
  });
  
  return {
    pipeline_name: pipelineVersionDetail.display_name || pipelineSpec.pipelineInfo?.name || 'Unknown Pipeline',
    pipeline_description: pipelineSpec.pipelineInfo?.description || '',
    nodes,
    edges,
    position: [0, 0],
    zoom: 1,
    pipeline_id: pipelineVersionDetail.pipeline_id,
    pipeline_type: 'kfp',
    last_version_id: pipelineVersionDetail.pipeline_version_id,
    created_at: pipelineVersionDetail.created_at,
    updated_at: pipelineVersionDetail.created_at
  };
}

function createEmptyWorkflow(pipelineVersionDetail: any, runDetails: any) {
  return {
    pipeline_name: 'Empty Pipeline',
    pipeline_description: '',
    nodes: [],
    edges: [],
    position: [0, 0],
    zoom: 1,
    pipeline_id: pipelineVersionDetail.pipeline_id || '',
    pipeline_type: 'kfp',
    last_version_id: pipelineVersionDetail.pipeline_version_id || '',
    created_at: pipelineVersionDetail.created_at || new Date().toISOString(),
    updated_at: pipelineVersionDetail.created_at || new Date().toISOString()
  };
}

function calculateOptimizedLayout(tasks: Record<string, any>) {
  const levels: Record<string, number> = {};
  const visited = new Set<string>();
  const levelGroups: Record<number, string[]> = {};
  
  function dfs(taskName: string): number {
    if (visited.has(taskName)) return levels[taskName] || 0;
    visited.add(taskName);
    
    const task = tasks[taskName];
    if (!task.dependentTasks || task.dependentTasks.length === 0) {
      levels[taskName] = 0;
      return 0;
    }
    
    let maxLevel = -1;
    task.dependentTasks.forEach((depTask: string) => {
      const depLevel = dfs(depTask);
      maxLevel = Math.max(maxLevel, depLevel);
    });
    
    levels[taskName] = maxLevel + 1;
    return levels[taskName];
  }
  
  Object.keys(tasks).forEach(taskName => dfs(taskName));
  
  Object.entries(levels).forEach(([taskName, level]) => {
    if (!levelGroups[level]) {
      levelGroups[level] = [];
    }
    levelGroups[level].push(taskName);
  });
  
  return { taskLevels: levels, levelGroups };
}

function mapComponentToNodeType(componentName: string): string {
  const baseName = componentName.replace('comp-', '');
  
  const typeMap: Record<string, string> = {
    'load-data-from-storage': 'NodeLoadData',
    'load-model-from-hf': 'NodeLoadPreLLM',
    'train-model-with-csv': 'NodeTrainMlModel',
    'get-model-metrics': 'NodeValMlModel',
    'pick-the-best-model': 'NodePickMlModel',
    'serve-model': 'NodeServeMlModel'
  };
  
  for (const [key, nodeType] of Object.entries(typeMap)) {
    if (baseName.startsWith(key)) {
      return nodeType;
    }
  }
  
  return 'CustomNode';
}

function getNodeLabel(componentName: string, taskName: string): string {
  const baseName = componentName.replace('comp-', '');
  
  const labelMap: Record<string, string> = {
    'load-data-from-storage': '데이터 로딩',
    'load-model-from-hf': '사전학습 모델 불러오기',
    'train-model-with-csv': 'ML 학습',
    'get-model-metrics': '모델 평가',
    'pick-the-best-model': '최적 모델 선택',
    'serve-model': '모델 서빙'
  };
  
  for (const [key, label] of Object.entries(labelMap)) {
    if (baseName.startsWith(key)) {
      const remaining = baseName.substring(key.length);
      const hyphenNumberMatch = remaining.match(/-(\d+)$/);
      return hyphenNumberMatch ? `${label} ${hyphenNumberMatch[1]}` : label;
    }
  }
  
  // CustomNode용 라벨
  return baseName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function extractAttributeFromTask(task: any, component: any) {
  const baseName = task.componentRef.name.replace('comp-', '').replace(/-/g, '_');
  
  const attribute: any = {
    type: baseName
  };
  
  if (task.inputs?.parameters?.params?.runtimeValue?.constant) {
    try {
      const params = JSON.parse(task.inputs.parameters.params.runtimeValue.constant);
      Object.assign(attribute, params);
    } catch (e) {
      console.warn('Failed to parse task parameters:', e);
    }
  }
  
  return attribute;
}

function findMatchingRunTask(taskDetails: any[], taskName: string, task: any) {
  return taskDetails.find((detail: any) => {
    if (!detail.display_name) return false;
    
    const displayName = detail.display_name.toLowerCase();
    const taskNameLower = taskName.toLowerCase();
    
    if (displayName === taskNameLower) return true;
    if (displayName.replace(/-/g, '') === taskNameLower.replace(/-/g, '')) return true;
    return !!(displayName.includes(taskNameLower) || taskNameLower.includes(displayName));
  });
}
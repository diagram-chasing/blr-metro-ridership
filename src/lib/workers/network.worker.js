// src/lib/workers/network.worker.js

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  scaleSqrt
} from 'd3';

// ... (state variables are the same)
let simulation;
let nodes = [];
let bounds = {
  width: 0,
  height: 0
};
let interchanges = new Set();
let importantStations = new Set();
let latestSelectedNode = null;
let latestConnectedNodes = new Set();

self.onmessage = (e) => {
  const {
    type,
    payload
  } = e.data;
  switch (type) {
    case 'RESIZE':
      bounds = {
        width: payload.width,
        height: payload.height
      };
      interchanges = new Set(payload.interchanges);
      importantStations = new Set(payload.importantStations);
      simulation?.stop();
      initializeSimulation(payload);
      break;
    case 'UPDATE_SELECTION_STATE':
      latestSelectedNode = payload.selectedNode;
      latestConnectedNodes = payload.connectedNodes;


      calculateAndPostLabels({
        selectedNode: latestSelectedNode,
        connectedNodes: latestConnectedNodes
      });

      break;
  }
};

function initializeSimulation({
  networkNodes,
  networkLinks,
  width,
  height,
  isMobile,
  simConfig
}) {
  nodes = networkNodes.map((d, i) => ({
    ...d,
    index: i
  }));
  const rawLinks = Object.values(networkLinks).map(([source, target, value]) => ({
    source,
    target,
    value
  }));
  const maxRidership = Math.max(...nodes.map((d) => d.total_ridership));
  const radiusScale = scaleSqrt().domain([0, maxRidership]).range([simConfig.NODE_RADIUS_MIN, simConfig.NODE_RADIUS_MAX]);
  nodes.forEach((node) => (node.radius = radiusScale(node.total_ridership || 1)));
  const maxValue = Math.max(...rawLinks.map((d) => d.value));
  const linkWidthScale = scaleSqrt().domain([1, maxValue]).range([simConfig.LINK_WIDTH_MIN, simConfig.LINK_WIDTH_MAX]);
  const linksForSim = rawLinks.map((d) => ({
    ...d,
    width: linkWidthScale(d.value)
  }));
  const lineFocalPoints = isMobile ? {
    Purple: {
      x: width / 2,
      y: height * 0.25
    },
    Green: {
      x: width / 2,
      y: height * 0.75
    },
    default: {
      x: width / 2,
      y: height / 2
    }
  } : {
    Purple: {
      x: width * 0.25,
      y: height / 2
    },
    Green: {
      x: width * 0.75,
      y: height / 2
    },
    default: {
      x: width / 2,
      y: height / 2
    }
  };
  const linkDistanceScale = scaleSqrt().domain([1, maxValue]).range([simConfig.LINK_DISTANCE * 0.3, simConfig.LINK_DISTANCE]);
  const linkStrengthScale = scaleSqrt().domain([1, maxValue]).range([simConfig.LINK_STRENGTH * 0.2, simConfig.LINK_STRENGTH]);
  const boundaryForce = () => {
    const margin = 50;
    nodes.forEach((node) => {
      if (node.x < margin) node.vx += (margin - node.x) * 0.1;
      else if (node.x > width - margin) node.vx += (width - margin - node.x) * 0.1;
      if (node.y < margin) node.vy += (margin - node.y) * 0.1;
      else if (node.y > height - margin) node.vy += (height - margin - node.y) * 0.1;
    });
  };
  simulation = forceSimulation(nodes)
    .force('link', forceLink(linksForSim).id((d) => d.index).distance((d) => linkDistanceScale(d.value)).strength((d) => linkStrengthScale(d.value)))
    .force('charge', forceManyBody().strength(simConfig.CHARGE_STRENGTH))
    .force('collide', forceCollide().radius((d) => d.radius + simConfig.COLLIDE_PADDING))
    .force('boundary', boundaryForce)
    .force('x', forceX((d) => (lineFocalPoints[d.group] || lineFocalPoints.default).x).strength(simConfig.FORCE_X_STRENGTH))
    .force('y', forceY((d) => (lineFocalPoints[d.group] || lineFocalPoints.default).y).strength(simConfig.FORCE_Y_STRENGTH));

  const linksForMainThread = linksForSim.map((l) => ({
    source: l.source.index,
    target: l.target.index,
    value: l.value,
    width: l.width
  }));
  self.postMessage({
    type: 'INIT_DONE',
    payload: {
      nodes,
      links: linksForMainThread
    }
  });
  let tickCount = 0;
  const maxTicks = simConfig.ANIMATION_DURATION_MS / 16;
  simulation.on('tick', () => {
    self.postMessage({
      type: 'TICK',
      payload: {
        nodes
      }
    });
    if (++tickCount > maxTicks) {
      simulation.stop();
    }
  });

  simulation.on('end', () => {
    // Always calculate labels when simulation ends, even with no selection
    calculateAndPostLabels({
      selectedNode: latestSelectedNode,
      connectedNodes: latestConnectedNodes
    });

    self.postMessage({
      type: 'SIMULATION_END'
    });
  });
}

// The `calculateAndPostLabels` function is unchanged and correct.
function calculateAndPostLabels({
  selectedNode,
  connectedNodes
}) {
  if (nodes.length === 0) return;
  const labels = [];
  const placedBoxes = [];
  const FONT_SIZE = 12;
  const CHAR_WIDTH = FONT_SIZE * 0.6;
  const PADDING = 4;
  const MARGIN = 10;
  const getPriority = (node) => {
    if (node.index === selectedNode) return 5;
    if (connectedNodes.has(node.index)) return 4;
    if (interchanges.has(node.id)) return 3;
    if (importantStations.has(node.id)) return 2;
    return 1;
  };
  const sortedNodes = [...nodes].sort((a, b) => {
    const priorityA = getPriority(a);
    const priorityB = getPriority(b);
    if (priorityA !== priorityB) return priorityB - priorityA;
    return (b.total_ridership || 0) - (a.total_ridership || 0);
  });
  for (const node of sortedNodes) {
    const priority = getPriority(node);
    if (priority < 2) continue;
    const labelWidth = node.id.length * CHAR_WIDTH;
    const labelHeight = FONT_SIZE;
    const positions = [{
      x: node.x,
      y: node.y - node.radius - PADDING - 3,
      anchor: 'middle'
    },
    {
      x: node.x,
      y: node.y + node.radius + labelHeight,
      anchor: 'middle'
    },
    {
      x: node.x - node.radius - PADDING,
      y: node.y + labelHeight / 2 - 2,
      anchor: 'end'
    },
    {
      x: node.x + node.radius + PADDING,
      y: node.y + labelHeight / 2 - 2,
      anchor: 'start'
    }
    ];
    for (const pos of positions) {
      let x1, x2;
      if (pos.anchor === 'middle') {
        x1 = pos.x - labelWidth / 2;
        x2 = pos.x + labelWidth / 2;
      } else if (pos.anchor === 'end') {
        x1 = pos.x - labelWidth;
        x2 = pos.x;
      } else {
        x1 = pos.x;
        x2 = pos.x + labelWidth;
      }
      const box = {
        x1: x1 - PADDING,
        y1: pos.y - labelHeight - PADDING,
        x2: x2 + PADDING,
        y2: pos.y + PADDING
      };
      if (box.x1 < MARGIN || box.x2 > bounds.width - MARGIN || box.y1 < MARGIN || box.y2 > bounds.height - MARGIN) continue;
      let collides = placedBoxes.some((placed) => box.x1 < placed.x2 && box.x2 > placed.x1 && box.y1 < placed.y2 && box.y2 > placed.y1);
      if (!collides) {
        labels.push({
          id: node.id,
          labelX: pos.x,
          labelY: pos.y,
          textAlign: pos.anchor,
          nodeGroup: node.group,
          isMajor: interchanges.has(node.id),
          isSelected: node.index === selectedNode,
          isConnected: connectedNodes.has(node.index)
        });
        placedBoxes.push(box);
        break;
      }
    }
  }
  self.postMessage({
    type: 'LABELS_UPDATED',
    payload: {
      labels
    }
  });
}
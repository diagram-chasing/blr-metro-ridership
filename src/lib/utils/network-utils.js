// src/lib/utils/network-utils.js

/**
 * Gets simulation configuration constants.
 * Note: This is now used on the main thread just to pass the config to the worker.
 */
export const getSimConfig = (isMobileDevice) => ({
  ANIMATION_DURATION_MS: 4000,
  NODE_RADIUS_MIN: isMobileDevice ? 3 : 5,
  NODE_RADIUS_MAX: isMobileDevice ? 15 : 30,
  LINK_WIDTH_MIN: 0.1,
  LINK_WIDTH_MAX: isMobileDevice ? 5 : 10,
  CHARGE_STRENGTH: isMobileDevice ? -100 : -200,
  COLLIDE_PADDING: isMobileDevice ? 3 : 5,
  LINK_DISTANCE: isMobileDevice ? 110 : 400,
  LINK_STRENGTH: 0.9,
  FORCE_X_STRENGTH: isMobileDevice ? 0.35 : 0.12,
  FORCE_Y_STRENGTH: isMobileDevice ? 0.5 : 1.2
});

/**
* CSS variable names for line colors.
*/
export const lineColors = {
  Purple: '--color-brand-purple',
  Green: '--color-brand-green',
  Yellow: '--color-brand-yellow',
  Black: '--color-brown-800'
};

/**
* Processes raw network and station data to create maps and sorted options.
*/
export function processStationData(networkNodes, stationCodesData) {
  const stationCodeMap = new Map();
  const reverseStationMap = new Map();
  stationCodesData.forEach((s) => {
    stationCodeMap.set(s.Station, s.code);
    reverseStationMap.set(s.code, s.Station);
  });

  const stationOptions = networkNodes
    .map((node) => ({
      value: stationCodeMap.get(node.id) || node.id,
      label: node.id
    }))
    .filter((option) => option.value)
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    stationCodeMap,
    reverseStationMap,
    stationOptions
  };
}

/**
* Calculates the visual style properties for a given node.
*/
export function getNodeStyle({
  node,
  isSelected,
  isConnected,
  isAnyNodeSelected,
  isMajor
},
  resolvedColors
) {
  const isDimmed = isAnyNodeSelected && !isSelected && !isConnected;

  let fill = resolvedColors[node.group] || 'gray';
  let stroke = 'rgba(255, 255, 255, 0.6)';
  let strokeWidth = 1.5;
  let alpha = 1.0;

  if (isMajor) {
    fill = '#000';
    stroke = resolvedColors[node.group] || 'gray';
    strokeWidth = 2;
  }

  if (isSelected) {
    fill = '#b07d62';
    stroke = '#b07d62';
    strokeWidth = 2;
  }

  if (isDimmed) {
    alpha = 0.2;
  }

  return {
    alpha,
    fill,
    stroke,
    strokeWidth
  };
}

/**
* Scales the canvas for high-resolution (Retina) displays.
*/
export function setupRetinaCanvas(canvasEl, context, width, height) {
  if (!canvasEl || !context) return;
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width = width * dpr;
  canvasEl.height = height * dpr;
  canvasEl.style.width = `${width}px`;
  canvasEl.style.height = `${height}px`;
  context.scale(dpr, dpr);
  context.imageSmoothingEnabled = true;
}

/**
* Finds all nodes and links directly connected to a given node.
*/
export function findConnected(nodeIndex, links) {
  const connected = {
    nodes: new Set(),
    links: new Set()
  };
  links.forEach((link) => {
    if (link.source === nodeIndex) {
      connected.nodes.add(link.target);
      connected.links.add(link);
    }
    if (link.target === nodeIndex) {
      connected.nodes.add(link.source);
      connected.links.add(link);
    }
  });
  return connected;
}

/**
* Finds the node at a specific (x, y) coordinate on the canvas.
*/
export function findNodeAtPosition(x, y, nodes) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
    if (distance < node.radius + 4) {
      return node;
    }
  }
  return null;
}
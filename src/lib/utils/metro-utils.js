import { geoMercator, scaleLinear, scaleThreshold } from 'd3';

function buildMetroGraph(stationOrder) {
	const graph = new Map();
	const addNode = (code) => { if (!graph.has(code)) graph.set(code, { neighbors: new Set(), lines: new Set() }); };
	for (const [lineColor, codes] of Object.entries(stationOrder)) {
		for (let i = 0; i < codes.length; i++) {
			const currentCode = codes[i];
			addNode(currentCode);
			graph.get(currentCode).lines.add(lineColor);
			if (i > 0) {
				const prevCode = codes[i - 1];
				graph.get(currentCode).neighbors.add(prevCode);
				graph.get(prevCode).neighbors.add(currentCode);
			}
		}
	}
	return graph;
}

function findShortestPath(graph, startCode, endCode) {
	if (!graph.has(startCode) || !graph.has(endCode)) return null;
	const queue = [[startCode]];
	const visited = new Set([startCode]);
	while (queue.length > 0) {
		const path = queue.shift();
		const node = path[path.length - 1];
		if (node === endCode) return path;
		for (const neighbor of graph.get(node)?.neighbors || []) {
			if (!visited.has(neighbor)) {
				visited.add(neighbor);
				queue.push([...path, neighbor]);
			}
		}
	}
	return null;
}

function segmentRouteByLine(path, graph) {
	if (!path || path.length < 2) return [];
	const segments = [];
	let currentSegment = { line: '', stations: [path[0]] };
	for (let i = 1; i < path.length; i++) {
		const prevNodeInfo = graph.get(path[i - 1]);
		const currNodeInfo = graph.get(path[i]);
		const commonLine = [...prevNodeInfo.lines].find(line => currNodeInfo.lines.has(line));
		if (currentSegment.line && currentSegment.line !== commonLine) {
			segments.push(currentSegment);
			currentSegment = { line: commonLine, stations: [path[i - 1], path[i]] };
		} else {
			currentSegment.line = currentSegment.line || commonLine;
			currentSegment.stations.push(path[i]);
		}
	}
	segments.push(currentSegment);
	return segments;
}

function getSmartLabels(stations, stationOrder, bounds = null) {
	const labels = [];
	const placedBoxes = [];
	const FONT_SIZE = 12;
	const CHAR_WIDTH = FONT_SIZE * 0.6;
	const PADDING = 5;
	const MARGIN = 15;
	
	const stationPriority = new Map();
	Object.values(stationOrder).forEach(codes => {
		codes.forEach((code, i) => {
			const currentPriority = stationPriority.get(code) || 0;
			if (i === 0 || i === codes.length - 1) {
				stationPriority.set(code, Math.max(currentPriority, 3));
			} else {
				stationPriority.set(code, Math.max(currentPriority, 1));
			}
		});
	});
	
	const sortedStations = [...stations.values()].sort((a, b) => {
		const aPriority = stationPriority.get(a.code) || 1;
		const bPriority = stationPriority.get(b.code) || 1;
		if (b.isInterchange && !a.isInterchange) return 1;
		if (a.isInterchange && !b.isInterchange) return -1;
		return bPriority - aPriority;
	});
	
	for (const station of sortedStations) {
		const labelWidth = station.name.length * CHAR_WIDTH;
		const positions = [
			{ x: station.x, y: station.y - FONT_SIZE - 2, dy: -10 }, // top
			{ x: station.x, y: station.y + FONT_SIZE + 2, dy: 5 },   // bottom
			{ x: station.x - labelWidth/2 - 5, y: station.y, dy: 2 }, // left
			{ x: station.x + labelWidth/2 + 5, y: station.y, dy: 2 }  // right
		];
		
		let placed = false;
		for (const pos of positions) {
			const box = {
				x1: pos.x - labelWidth/2 - PADDING,
				y1: pos.y - FONT_SIZE/2 - PADDING,
				x2: pos.x + labelWidth/2 + PADDING,
				y2: pos.y + FONT_SIZE/2 + PADDING
			};
			
			// Check bounds - temporarily disable strict bounds checking
			// if (bounds && (box.x1 < bounds.minX + MARGIN || box.x2 > bounds.maxX - MARGIN || 
			//			   box.y1 < bounds.minY + MARGIN || box.y2 > bounds.maxY - MARGIN)) {
			//	continue;
			// }
			
			// Check collisions
			let collides = false;
			for (const placedBox of placedBoxes) {
				if (box.x1 < placedBox.x2 && box.x2 > placedBox.x1 && box.y1 < placedBox.y2 && box.y2 > placedBox.y1) {
					collides = true;
					break;
				}
			}
			
			if (!collides) {
				labels.push({ ...station, x: pos.x, y: pos.y, dy: pos.dy });
				placedBoxes.push(box);
				placed = true;
				break;
			}
		}
	}
	console.log('getSmartLabels result:', labels.length, 'labels out of', sortedStations.length, 'stations');
	return labels;
}

function findClosestPointIndex(targetCoord, linePoints) {
	let closestDistanceSq = Infinity, closestIndex = -1;
	for (let i = 0; i < linePoints.length; i++) {
		const p = linePoints[i];
		const dx = p.x - targetCoord.x;
		const dy = p.y - targetCoord.y;
		const dSq = dx * dx + dy * dy;
		if (dSq < closestDistanceSq) {
			closestDistanceSq = dSq;
			closestIndex = i;
		}
	}
	return closestIndex;
}

function processLineFeatures(features, projection, bounds) {
	const projectAndClip = lineCoords => lineCoords.map(([lon, lat]) => ({ x: projection([lon, lat])[0], y: projection([lon, lat])[1] })).filter(p => p.x >= bounds.minX && p.x <= bounds.maxX && p.y >= bounds.minY && p.y <= bounds.maxY);
	return features.flatMap(feature => {
		const type = feature.geometry?.type;
		if (type === 'LineString') {
			const points = projectAndClip(feature.geometry.coordinates);
			return points.length > 1 ? [points] : [];
		}
		if (type === 'MultiLineString') {
			return feature.geometry.coordinates.map(projectAndClip).filter(line => line.length > 1);
		}
		return [];
	});
}

function processPolygonFeatures(features, projection, bounds, idPrefix) {
	const projectAndCheck = polygonCoords => {
		const points = polygonCoords.map(([lon, lat]) => ({ x: projection([lon, lat])[0], y: projection([lon, lat])[1] }));
		return points.some(p => p.x >= bounds.minX && p.x <= bounds.maxX && p.y >= bounds.minY && p.y <= bounds.maxY) ? points : null;
	};
	return features.flatMap((feature, featureIndex) => {
		const type = feature.geometry?.type;
		const process = (coords, pIdx) => {
			const points = projectAndCheck(coords[0]);
			return points ? { id: `${idPrefix}-${featureIndex}-${pIdx}`, points, name: feature.properties.name || '' } : null;
		};
		if (type === 'Polygon') {
			return process(feature.geometry.coordinates, 0) ? [process(feature.geometry.coordinates, 0)] : [];
		}
		if (type === 'MultiPolygon') {
			return feature.geometry.coordinates.map(process).filter(Boolean);
		}
		return [];
	});
}

function processLanduseFeatures(features, projection, bounds, colors, canvasWidth, canvasHeight) {
	const volumes = features.map(f => f.properties.mean_volume).filter(v => v != null && !isNaN(v));
	const minVolume = Math.min(...volumes);
	const maxVolume = Math.max(...volumes);

	// Use warm colors from CSS
	const warmColors = ['#f2e8cf', '#e8d5b7', '#ddbf8c', '#d4a574', '#c8956d', '#b07d62'];
	
	// Create d3 scales for better color and opacity mapping
	const colorScale = scaleThreshold()
		.domain([
			minVolume + (maxVolume - minVolume) * 0.2,
			minVolume + (maxVolume - minVolume) * 0.4,
			minVolume + (maxVolume - minVolume) * 0.6,
			minVolume + (maxVolume - minVolume) * 0.8,
			maxVolume
		])
		.range(warmColors);

	const opacityScale = scaleLinear()
		.domain([minVolume, maxVolume])
		.range([0.3, 1.0])
		.clamp(true);

	// Create coordinate transformation to map from projected coordinates to canvas coordinates
	const transformToCanvas = (projectedPoint) => {
		const x = ((projectedPoint.x - bounds.minX) / (bounds.maxX - bounds.minX)) * canvasWidth;
		// Flip y-axis: subtract from canvasHeight to invert
		const y = canvasHeight - ((projectedPoint.y - bounds.minY) / (bounds.maxY - bounds.minY)) * canvasHeight;
		return { x, y };
	};

	const projectAndCheck = polygonCoords => {
		const projectedPoints = polygonCoords.map(([lon, lat]) => {
			const projected = projection([lon, lat]);
			return { x: projected[0], y: projected[1] };
		});

		// Check if any point is within the visible metro bounds
		const hasVisiblePoint = projectedPoints.some(p =>
			p.x >= bounds.minX && p.x <= bounds.maxX &&
			p.y >= bounds.minY && p.y <= bounds.maxY
		);

		if (!hasVisiblePoint) return null;

		// Transform to canvas coordinates
		const canvasPoints = projectedPoints.map(transformToCanvas);
		return canvasPoints;
	};

	const filteredFeatures = features
		.filter(f => f.properties.mean_volume > minVolume + (maxVolume - minVolume) * 0.1)
		.slice(0, 500);


	const results = filteredFeatures.flatMap((feature, featureIndex) => {
		if (feature.geometry?.type === 'Polygon') {
			const points = projectAndCheck(feature.geometry.coordinates[0]);
			if (points) {
				const volume = feature.properties.mean_volume || 0;
				const color = colorScale(volume);
				const opacity = opacityScale(volume);
				return [{ id: `landuse-${featureIndex}`, points, color, opacity }];
			}
		}
		return [];
	});


	return results;
}

export function initializeMetroData(metroData, stationOrder, width, height, lineColors, roadsData, areasData, landusePayload = null) {
	if (!width || !height || !metroData) return null;

	const metroLinesRaw = metroData.features.filter(f => f.geometry.type === 'LineString');
	const stationsRaw = metroData.features.filter(f => f.geometry.type === 'Point');

	const stationLineCounts = new Map();
	Object.values(stationOrder).forEach(codes => {
		codes.forEach(code => stationLineCounts.set(code, (stationLineCounts.get(code) || 0) + 1));
	});

	const projection = geoMercator().fitExtent([[20, 20], [width - 20, height - 20]], { type: 'FeatureCollection', features: metroData.features }).reflectY(true);

	const stations = new Map(stationsRaw.map(s => {
		const [x, y] = projection(s.geometry.coordinates);
		const { name, code, colour } = s.properties;
		return [code, { x, y, name, code, lineColor: colour, color: lineColors[colour], isInterchange: (stationLineCounts.get(code) || 0) > 1 }];
	}));

	const lines = new Map(metroLinesRaw.map(l => {
		const { name, colour } = l.properties;
		const points = l.geometry.coordinates.map(c => ({ x: projection(c)[0], y: projection(c)[1] }));
		return [name, { name, color: colour, points }];
	}));

	const stationCoords = [...stations.values()];
	const metroBounds = { minX: Math.min(...stationCoords.map(s => s.x)) - 50, maxX: Math.max(...stationCoords.map(s => s.x)) + 50, minY: Math.min(...stationCoords.map(s => s.y)) - 50, maxY: Math.max(...stationCoords.map(s => s.y)) + 50 };


	return {
		stations,
		lines,
		graph: buildMetroGraph(stationOrder),
		staticLabels: getSmartLabels(stations, stationOrder, { minX: 20, maxX: width - 20, minY: 20, maxY: height - 20 }),
		roads: roadsData ? processLineFeatures(roadsData.features, projection, metroBounds) : [],
		lakes: areasData ? processPolygonFeatures(areasData.features.filter(f => f.properties.layer === 'Lakes'), projection, metroBounds, 'lake') : [],
		parks: areasData ? processPolygonFeatures(areasData.features.filter(f => f.properties.layer === 'Parks'), projection, metroBounds, 'park') : [],
		landuse: landusePayload ? processLanduseFeatures(landusePayload.data.features, projection, metroBounds, null, width, height) : [],
	};
}

export function getDisplayData(metroContext, appState) {
	const defaultDisplay = { stations: [], routeSegments: [], labels: [] };
	if (!metroContext) return defaultDisplay;

	const { stations, lines, graph, staticLabels } = metroContext;
	const { mode, fromStation, toStation, highlightStation } = appState;

	const routePath = (mode === 'route' && fromStation && toStation) ? findShortestPath(graph, fromStation, toStation) : null;
	const routeStationCodes = new Set(routePath || []);

	const displayStations = [...stations.values()].map(station => {
		const isOnRoute = routeStationCodes.has(station.code);
		const isHighlighted = station.code === highlightStation;
		let fill = station.color;
		let stroke = 'white';

		if (mode === 'highlight' && isHighlighted) {
			fill = 'var(--color-black)';
			stroke = 'var(--color-black)';
		} else if (mode === 'route' && !isOnRoute) {
			fill = 'var(--color-gray-100)';
			stroke = 'var(--color-metro-light-grey)';
		}

		return { ...station, fill, stroke, isOnRoute, isHighlighted };
	});

	let labels = [];
	if (mode === 'default') {
		labels = staticLabels || [];
	} else if (mode === 'highlight' && highlightStation) {
		const highlightedStation = stations.get(highlightStation);
		if (highlightedStation) labels = [highlightedStation];
	} else if (mode === 'route') {
		if (fromStation || toStation) {
			labels = displayStations.filter(s => s.code === fromStation || s.code === toStation);
		} else {
			labels = staticLabels || [];
		}
	}

	const routeSegments = (routePath ? segmentRouteByLine(routePath, graph) : []).map(segment => {
		const line = [...lines.values()].find(l => l.color === segment.line);
		if (!line || segment.stations.length < 2) return null;
		const startStation = stations.get(segment.stations[0]);
		const endStation = stations.get(segment.stations[segment.stations.length - 1]);
		if (!startStation || !endStation) return null;
		const startIndex = findClosestPointIndex(startStation, line.points);
		const endIndex = findClosestPointIndex(endStation, line.points);
		const points = line.points.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
		return { name: `${line.name}_route`, color: line.color, points };
	}).filter(Boolean);

	return { stations: displayStations, routeSegments, labels };
}
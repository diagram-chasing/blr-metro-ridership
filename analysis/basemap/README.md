# basemap

QGIS project file for the basemap used in the analysis.

## Usage

1. Open QGIS
2. Open the project file [basemap.qgz](basemap.qgz)

## Layers

- [Arterial Roads](arterial_roads_dissolved.gpkg): Arterial roads in Bengaluru, sourced from [OpenStreetMap](https://www.openstreetmap.org). Dissolved to remove duplicate lines.
- [Lakes](lakes.gpkg): Lakes in Bengaluru, sourced from [OpenStreetMap](https://www.openstreetmap.org). Filtered to only include major lakes based on lake area.
- [Parks](parks.gpkg): Parks in Bengaluru, sourced from [OpenStreetMap](https://www.openstreetmap.org). Filtered to only include major parks based on park area.
# built-up-volume

## Overview

This script fetches built-up volume data from the GHSL dataset and extracts the data for the Bengaluru region. The output file will be saved to the `../data/` directory.

## Usage

From the `analysis/built-up-volume/` directory:

```bash
bash fetch.sh
```

This will download the dataset, extract it, and create `../data/built-up-volume.tif` with the cropped data for the Bengaluru region.

## Output

- `../data/built-up-volume.tif` - Cropped built-up volume data for Bengaluru region

## Source

From the [GHS built-up volume (R2023)](https://human-settlement.emergency.copernicus.eu/download.php?ds=builtV)
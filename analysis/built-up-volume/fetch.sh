#!/bin/bash

wget "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_BUILT_V_GLOBE_R2023A/GHS_BUILT_V_NRES_E2025_GLOBE_R2023A_4326_3ss/V1-0/tiles/GHS_BUILT_V_NRES_E2025_GLOBE_R2023A_4326_3ss_V1_0_R8_C26.zip"

unzip GHS_BUILT_V_NRES_E2025_GLOBE_R2023A_4326_3ss_V1_0_R8_C26.zip

gdal_translate -co compress=LZW -projwin 77.3 13.3 78 12.6 GHS_BUILT_V_NRES_E2025_GLOBE_R2023A_4326_3ss_V1_0_R8_C26.tif ../data/built-up-volume.tif
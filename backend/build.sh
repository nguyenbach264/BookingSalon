#!/bin/bash
cd "$(dirname "$0")"
echo "Removing target folder..."
rm -rf target
echo "Target folder removed!"
echo "Building with Maven..."
./mvnw clean package -DskipTests
echo "Build complete!"

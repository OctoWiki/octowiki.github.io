#!/bin/bash

# Build SamplePlugin for TiddlyWiki5

tiddlywiki \
	./wiki \
	--verbose \
	--build \
	|| exit 1

mv wiki/output/* ./

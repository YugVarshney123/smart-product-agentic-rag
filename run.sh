#!/bin/bash
cd "$(dirname "$0")"
python -m uvicorn backend.main:app --reload

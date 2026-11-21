#!/usr/bin/env bash
mkdir -p screenshots
playwright-cli open http://localhost:3002
playwright-cli screenshot --filename=screenshots/latest.jpg
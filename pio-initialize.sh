#!/bin/bash
pio-start-all
pio status
sudo chown pio app/media/jsons
npm run pio-queues

#!/bin/bash
pio-start-all
pio status
sudo chown pio media/jsons
npm run pio-queues

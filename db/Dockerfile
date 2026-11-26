FROM postgres:17-alpine

# Runs once, on first start with an empty data directory
COPY init/ /docker-entrypoint-initdb.d/

#!/bin/bash
set -e

airflow db migrate

airflow users create \
  --username "${AIRFLOW_ADMIN_USER:-admin}" \
  --password "${AIRFLOW_ADMIN_PASSWORD:-admin}" \
  --firstname Admin \
  --lastname User \
  --role Admin \
  --email "${AIRFLOW_ADMIN_EMAIL:-admin@admin.com}" \
|| airflow users set-password \
  --username "${AIRFLOW_ADMIN_USER:-admin}" \
  --password "${AIRFLOW_ADMIN_PASSWORD:-admin}"

airflow scheduler &
airflow webserver --port 8080

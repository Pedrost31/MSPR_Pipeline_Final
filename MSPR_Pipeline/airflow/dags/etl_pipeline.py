from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime
import os
import sys

# 🔧 Adapter les chemins pour Airflow
project_root = "/app"
sys.path.insert(0, project_root)

from etl.pipeline import run_pipeline

# ─────────────────────────────────────────────

def run_pipeline_task():
    run_pipeline()

# ─────────────────────────────────────────────

with DAG(
    dag_id="healthai_etl",
    start_date=datetime(2024, 1, 1),
    schedule_interval="@daily",   # exécution automatique
    catchup=False,
    tags=["healthai"],
) as dag:

    pipeline = PythonOperator(
        task_id="run_pipeline",
        python_callable=run_pipeline_task,
    )
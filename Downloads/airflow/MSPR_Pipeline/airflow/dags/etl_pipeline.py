from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys

sys.path.insert(0, "/app")

from etl.pipeline import run_pipeline


def run_pipeline_task():
    run_pipeline()


default_args = {
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="healthai_etl",
    description="Pipeline ETL HealthAI : extraction, transformation, chargement et contrôle qualité",
    default_args=default_args,
    start_date=datetime(2024, 1, 1),
    schedule="@daily",
    catchup=False,
    tags=["healthai", "etl"],
) as dag:

    pipeline = PythonOperator(
        task_id="run_pipeline",
        python_callable=run_pipeline_task,
    )

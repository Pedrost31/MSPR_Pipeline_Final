FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

# Installer dépendances Python + psycopg2
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir psycopg2-binary

COPY . .

CMD ["python", "scripts/run_pipeline.py"]
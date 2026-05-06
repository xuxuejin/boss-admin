FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential default-libmysqlclient-dev curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock README.md ./
COPY app ./app
COPY migrations ./migrations
COPY scripts ./scripts
COPY gunicorn.conf.py ./gunicorn.conf.py
COPY app.py ./app.py

RUN uv pip install --system .

EXPOSE 3001

CMD ["gunicorn", "app:create_app()", "-c", "gunicorn.conf.py"]

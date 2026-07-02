FROM python:3.11-slim-bookworm

ARG WE_MP_RSS_BROWSER_TYPE=chromium

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
    PYTHONUNBUFFERED=1 \
    INSTALL=True \
    HEADLESS=true \
    BROWSER_TYPE=${WE_MP_RSS_BROWSER_TYPE} \
    PLANT_PATH=/app/env

WORKDIR /app

COPY requirements.txt install.sh ./
RUN sed -i \
        -e 's|http://deb.debian.org/debian|https://mirrors.tuna.tsinghua.edu.cn/debian|g' \
        -e 's|http://deb.debian.org/debian-security|https://mirrors.tuna.tsinghua.edu.cn/debian-security|g' \
        /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        ca-certificates \
        wget \
        git \
        build-essential \
        zlib1g-dev \
        libgdbm-dev \
        libnss3-dev \
        libssl-dev \
        libreadline-dev \
        libffi-dev \
        libsqlite3-dev \
        procps \
    && rm -rf /var/lib/apt/lists/* \
    && chmod +x /app/install.sh \
    && /app/install.sh

COPY . .
COPY config.example.yaml /app/config.yaml
RUN chmod +x /app/start.sh \
    && mkdir -p /app/data

EXPOSE 8001
CMD ["/app/start.sh"]

# 请别再加前端编译了，前端编译非常占用工作流时间 ,可以 编译后复制到static目录再提交pull request
FROM --platform=$BUILDPLATFORM ghcr.io/rachelos/base-full:latest AS runtime

ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ENV INSTALL=True
ENV BROWSER_TYPE=webkit
ENV PLANT_PATH=/app/env

WORKDIR /app
RUN echo "1.0.$(date +%Y%m%d.%H%M)">>docker_version.txt
COPY requirements.txt install.sh ./
RUN apt-get update && apt-get install -y --no-install-recommends bash && rm -rf /var/lib/apt/lists/* \
    && chmod +x /app/install.sh && /app/install.sh

COPY . .
COPY config.example.yaml /app/config.yaml
RUN chmod +x /app/start.sh

EXPOSE 8001
CMD ["/app/start.sh"]

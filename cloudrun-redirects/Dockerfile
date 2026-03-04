FROM python:3.9-slim
COPY index.html /app/index.html
WORKDIR /app
CMD python3 -m http.server ${PORT:-8080}

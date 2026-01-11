FROM python:3.10-slim

WORKDIR /app

COPY ssh_honeypot/ .

RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

EXPOSE 2222

CMD [ "python", "ssh_honeypot.py" ]
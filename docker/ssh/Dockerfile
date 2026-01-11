# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy only the SSH honeypot folder
COPY ssh_honeypot/ .

# Install dependencies (ensure you have a requirements.txt in that folder)
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Expose the SSH port (usually 22 or 2222)
EXPOSE 2222

# Run the python script
CMD [ "python", "ssh_honeypot.py" ]
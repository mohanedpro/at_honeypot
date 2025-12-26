#!/usr/bin/env python3

import logging
from logging.handlers import RotatingFileHandler
import paramiko
import threading
import socket
import time
from pathlib import Path

# ======================
# CONFIG
# ======================

SSH_BANNER = "SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1"

BASE_DIR = Path(__file__).parent
LOG_DIR = BASE_DIR / "log_files"
KEY_DIR = BASE_DIR / "static"

LOG_DIR.mkdir(exist_ok=True)
KEY_DIR.mkdir(exist_ok=True)

CREDS_LOG = LOG_DIR / "creds_audits.log"
CMD_LOG = LOG_DIR / "cmd_audits.log"
SERVER_KEY = KEY_DIR / "server.key"

# ======================
# HOST KEY
# ======================

if SERVER_KEY.exists():
    HOST_KEY = paramiko.RSAKey(filename=str(SERVER_KEY))
else:
    HOST_KEY = paramiko.RSAKey.generate(2048)
    HOST_KEY.write_private_key_file(str(SERVER_KEY))

# ======================
# LOGGING
# ======================

fmt = logging.Formatter("%(asctime)s | %(message)s")

creds_logger = logging.getLogger("CREDS")
creds_logger.setLevel(logging.INFO)
creds_handler = RotatingFileHandler(CREDS_LOG, maxBytes=5*1024*1024, backupCount=10)
creds_handler.setFormatter(fmt)
creds_logger.addHandler(creds_handler)

cmd_logger = logging.getLogger("CMDS")
cmd_logger.setLevel(logging.INFO)
cmd_handler = RotatingFileHandler(CMD_LOG, maxBytes=5*1024*1024, backupCount=10)
cmd_handler.setFormatter(fmt)
cmd_logger.addHandler(cmd_handler)

# ======================
# SSH SERVER
# ======================

class HoneypotServer(paramiko.ServerInterface):

    def __init__(self, ip):
        self.client_ip = ip
        self.event = threading.Event()

    def get_allowed_auths(self, username):
        return "password"

    def check_auth_password(self, username, password):
        creds_logger.info(f"{self.client_ip}, {username}, {password}")
        return paramiko.AUTH_SUCCESSFUL  # honeypot accepts all

    def check_channel_request(self, kind, chanid):
        return paramiko.OPEN_SUCCEEDED if kind == "session" else paramiko.OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED

    def check_channel_shell_request(self, channel):
        self.event.set()
        return True

    def check_channel_pty_request(self, channel, *args):
        return True

# ======================
# FAKE FILESYSTEM
# ======================

FILESYSTEM = {
    "/": ["bin", "boot", "dev", "etc", "home", "lib", "tmp", "usr", "var"],
    "/etc": ["passwd", "shadow", "ssh"],
    "/usr": ["bin", "lib", "share"],
    "/home": ["admin"],
    "/home/admin": [".bashrc", ".ssh"],
}

FILES = {
    "/etc/passwd": (
        "root:x:0:0:root:/root:/bin/bash\n"
        "admin:x:1000:1000:admin:/home/admin:/bin/bash\n"
        "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin"
    )
}

# ======================
# COMMAND HANDLER
# ======================

def handle_command(cmd, cwd):

    if cmd in ("exit", "logout"):
        return "__exit__", cwd

    if cmd == "pwd":
        return cwd, cwd

    if cmd == "whoami":
        return "admin", cwd

    if cmd.startswith("cd"):
        parts = cmd.split()
        if len(parts) == 1:
            return "", "/home/admin"

        target = parts[1]
        new_dir = target if target.startswith("/") else f"{cwd}/{target}"
        new_dir = new_dir.replace("//", "/")

        if new_dir in FILESYSTEM:
            return "", new_dir
        return f"cd: no such file or directory: {target}", cwd

    if cmd == "ls":
        return "  ".join(FILESYSTEM.get(cwd, [])), cwd

    if cmd.startswith("cat"):
        parts = cmd.split()
        if len(parts) < 2:
            return "cat: missing file operand", cwd

        target = parts[1]
        target = target if target.startswith("/") else f"{cwd}/{target}"
        target = target.replace("//", "/")

        if target in FILES:
            return FILES[target], cwd
        return f"cat: {target}: No such file", cwd

    if cmd.startswith(("wget", "curl")):
        return "Saving to: payload.sh", cwd

    return f"{cmd}: command not found", cwd

# ======================
# FAKE SHELL
# ======================

def fake_shell(channel, client_ip):
    cwd = "/home/admin"
    prompt_user = "admin@ubuntu"

    def prompt():
        return f"{prompt_user}:{cwd}$ ".encode()

    buffer = b""
    channel.send(prompt())

    while True:
        try:
            char = channel.recv(1)
            if not char:
                break

            channel.send(char)
            buffer += char

            if char == b"\r":
                cmd = buffer.strip().decode(errors="ignore")
                buffer = b""
                time.sleep(0.15)

                cmd_logger.info(f"{client_ip} | {cwd} | {cmd}")

                output, cwd = handle_command(cmd, cwd)

                if output == "__exit__":
                    channel.send(b"\r\nlogout\r\n")
                    break

                channel.send(b"\r\n" + output.encode() + b"\r\n")
                channel.send(prompt())

        except Exception:
            break

    channel.close()

# ======================
# CLIENT HANDLER
# ======================

def handle_client(client, addr):
    client.settimeout(60)
    ip = addr[0]

    try:
        transport = paramiko.Transport(client)
        transport.local_version = SSH_BANNER
        transport.add_server_key(HOST_KEY)

        server = HoneypotServer(ip)
        transport.start_server(server=server)

        channel = transport.accept(20)
        if channel is None:
            return

        banner = (
            "Welcome to Ubuntu 22.04.3 LTS (GNU/Linux x86_64)\r\n"
            "Last login: Tue Oct 24 09:21:10 2025\r\n\r\n"
        )
        channel.send(banner.encode())
        fake_shell(channel, ip)

    except Exception:
        pass
    finally:
        try:
            transport.close()
        except Exception:
            pass
        client.close()

# ======================
# START SERVER
# ======================

def start_honeypot(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((host, port))
    sock.listen(100)

    print(f"[+] SSH honeypot listening on {host}:{port}")

    while True:
        client, addr = sock.accept()
        threading.Thread(target=handle_client, args=(client, addr), daemon=True).start()

# ======================
# MAIN
# ======================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=2222)
    args = parser.parse_args()

    try:
        start_honeypot(args.host, args.port)
    except KeyboardInterrupt:
        print("\n[!] Honeypot stopped")

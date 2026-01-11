#!/usr/bin/env python3

import logging
from logging.handlers import RotatingFileHandler
import paramiko
import threading
import socket
import time
import posixpath
from pathlib import Path

# CONFIGURATION

SSH_BANNER = "SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1"
BASE_DIR = Path(__file__).parent
LOG_DIR = BASE_DIR / "logs"
KEY_DIR = BASE_DIR / "static"

LOG_DIR.mkdir(exist_ok=True)
KEY_DIR.mkdir(exist_ok=True)

AUTH_LOG = LOG_DIR / "auth.log"
CMD_LOG = LOG_DIR / "session.log"
SERVER_KEY_PATH = KEY_DIR / "server.key"

# LOGGING SETUP

def setup_logger(name, log_file):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
    handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s"))
    logger.addHandler(handler)
    return logger

creds_logger = setup_logger("AUTH", AUTH_LOG)
cmd_logger = setup_logger("CMDS", CMD_LOG)

# HOST KEY MANAGEMENT

if SERVER_KEY_PATH.exists():
    HOST_KEY = paramiko.RSAKey(filename=str(SERVER_KEY_PATH))
else:
    HOST_KEY = paramiko.RSAKey.generate(2048)
    HOST_KEY.write_private_key_file(str(SERVER_KEY_PATH))

# MOCK SYSTEM ENGINE

class MockSystem:
    def __init__(self):
        self.cwd = "/home/admin"
        self.user = "admin"
        self.is_root = False
        self.hostname = "ubuntu"
        
        # Virtual Filesystem
        self.directories = ["/", "/bin", "/etc", "/home", "/home/admin", "/root", "/var", "/tmp"]
        self.files = {
            "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\nadmin:x:1000:1000::/home/admin:/bin/bash",
            "/etc/issue": "Ubuntu 22.04.3 LTS \n",
            "/home/admin/.bashrc": "PS1='${debian_chroot:+($debian_chroot)}\\u@\\h:\\w\\$ '",
        }

    def get_prompt(self):
        # Changes $ to # when user is root
        symbol = "#" if self.is_root else "$"
        return f"{self.user}@{self.hostname}:{self.cwd}{symbol} "

    def execute(self, cmd_line):
        parts = cmd_line.split()
        if not parts: return ""
        
        cmd = parts[0]
        args = parts[1:]

        if cmd in ("exit", "logout"): return "__EXIT__"
        if cmd == "clear": return "__CLEAR__"

        # Escalation Logic
        if cmd == "sudo" and len(args) > 0 and args[0] == "su":
            if self.is_root: return "Already root."
            return "__ASK_PASS__"

        # Navigation
        if cmd == "cd":
            target = args[0] if args else "/home/admin"
            target = target.replace("~", "/home/admin")
            new_path = posixpath.normpath(posixpath.join(self.cwd, target))
            
            if new_path in self.directories:
                if new_path == "/root" and not self.is_root:
                    return "-bash: cd: /root: Permission denied"
                self.cwd = new_path
                return ""
            return f"-bash: cd: {target}: No such file or directory"

        # Identity & System Info
        if cmd == "whoami": return self.user
        if cmd == "pwd": return self.cwd
        if cmd == "id":
            if self.is_root: return "uid=0(root) gid=0(root) groups=0(root)"
            return "uid=1000(admin) gid=1000(admin) groups=1000(admin)"

        if cmd == "ls":
            items = [posixpath.basename(p) for p in self.directories + list(self.files.keys()) 
                    if posixpath.dirname(p) == self.cwd and p != self.cwd]
            return "  ".join(sorted(set(items)))

        if cmd == "cat":
            if not args: return "cat: missing operand"
            target = posixpath.normpath(posixpath.join(self.cwd, args[0]))
            return self.files.get(target, f"cat: {args[0]}: No such file or directory")

        return f"{cmd}: command not found"

# SSH SERVER INTERFACE

class HoneypotServer(paramiko.ServerInterface):
    def __init__(self, client_ip):
        self.client_ip = client_ip
        self.auth_attempts = 0

    def check_auth_password(self, username, password):
        self.auth_attempts += 1
        creds_logger.info(f"LOGIN | IP: {self.client_ip} | User: {username} | Pass: {password}")
        
        time.sleep(1.5) # Realism delay
        # Fail the first attempt to mimic a harder target
        if self.auth_attempts < 2:
            return paramiko.AUTH_FAILED
        return paramiko.AUTH_SUCCESSFUL

    def get_allowed_auths(self, username):
        return "password"

    def check_channel_request(self, kind, chanid):
        return paramiko.OPEN_SUCCEEDED if kind == "session" else paramiko.OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED

    def check_channel_shell_request(self, channel): return True
    def check_channel_pty_request(self, channel, *args): return True

# TERMINAL HANDLER

def handle_fake_shell(channel, client_ip):
    system = MockSystem()
    
    # Initial Banner
    banner = "Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)\r\n\r\n"
    channel.send(banner)

    while True:
        try:
            channel.send(system.get_prompt())
            
            # Read command line with echo
            line = b""
            while not line.endswith(b"\r"):
                char = channel.recv(1)
                if not char: return
                if char == b"\x7f": # Backspace
                    if len(line) > 0:
                        line = line[:-1]
                        channel.send(b"\b \b")
                else:
                    line += char
                    channel.send(char)

            channel.send(b"\n")
            cmd_str = line.decode(errors="ignore").strip()
            
            if cmd_str:
                cmd_logger.info(f"{client_ip} | {system.cwd} | {cmd_str}")
                response = system.execute(cmd_str)
                
                if response == "__EXIT__":
                    break
                elif response == "__CLEAR__":
                    channel.send(b"\033[2J\033[H")
                elif response == "__ASK_PASS__":
                    # Silent Password Entry
                    channel.send(f"[sudo] password for {system.user}: ".encode())
                    pass_input = b""
                    while not pass_input.endswith(b"\r"):
                        p_char = channel.recv(1)
                        if not p_char: break
                        pass_input += p_char
                    
                    # Log the sudo password
                    sudo_pass = pass_input.decode(errors="ignore").strip()
                    cmd_logger.info(f"{client_ip} | SUDO PASS | {sudo_pass}")
                    
                    time.sleep(1)
                    channel.send(b"\r\n")
                    # Escalate state
                    system.is_root = True
                    system.user = "root"
                    system.cwd = "/root"
                elif response:
                    channel.send(response.replace("\n", "\r\n") + "\r\n")

        except Exception:
            break
    channel.close()

# NETWORK LISTENER

def start_server(host="0.0.0.0", port=2222):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((host, port))
    sock.listen(100)
    print(f"[*] Honeypot listening on {host}:{port}")

    while True:
        client, addr = sock.accept()
        threading.Thread(target=handle_session, args=(client, addr), daemon=True).start()

def handle_session(client, addr):
    try:
        transport = paramiko.Transport(client)
        transport.local_version = SSH_BANNER
        transport.add_server_key(HOST_KEY)
        server = HoneypotServer(addr[0])
        transport.start_server(server=server)
        channel = transport.accept(20)
        if channel:
            handle_fake_shell(channel, addr[0])
    except:
        pass
    finally:
        client.close()

if __name__ == "__main__":
    start_server()
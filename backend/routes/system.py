import psutil
import time
import os
from flask import Blueprint, jsonify, g
import subprocess

system_bp = Blueprint("system", __name__)

backend_process = psutil.Process(os.getpid())

START_TIME = time.time()
REQUEST_COUNT = 0
TOTAL_RESPONSE_TIME = 0.0
NETWORK_IN = 0
NETWORK_OUT = 0

def register_request():
    global REQUEST_COUNT, NETWORK_IN
    REQUEST_COUNT += 1
    content_length = g.get("content_length", None)
    if content_length:
        NETWORK_IN += content_length

def register_request_time(duration_ms: float, response):
    global TOTAL_RESPONSE_TIME, NETWORK_OUT
    TOTAL_RESPONSE_TIME += duration_ms
    if response and response.data:
        NETWORK_OUT += len(response.data)

def get_gpu_usage_by_pid(pid: int):
    """Використання GPU конкретним процесом (MB). Повертає None, якщо немає процесів)."""
    try:
        output = subprocess.check_output(
            ["nvidia-smi", "--query-compute-apps=pid,used_memory", "--format=csv,noheader,nounits"],
            encoding="utf-8"
        )
        usage = 0
        for line in output.strip().split("\n"):
            line_pid, mem = line.strip().split(",")
            if int(line_pid) == pid:
                usage += int(mem)  # MB
        return round(usage / 1024, 3)  # GB
    except Exception:
        return None

def get_gpu_total_usage():
    """Загальне завантаження GPU у % та пам'яті (GB)"""
    try:
        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total",
             "--format=csv,noheader,nounits"],
            encoding="utf-8"
        )
        gpu_stats = []
        for line in output.strip().split("\n"):
            util, mem_used, mem_total = map(int, line.strip().split(","))
            gpu_stats.append({
                "util_percent": util,
                "memory_used_gb": round(mem_used / 1024, 3),
                "memory_total_gb": round(mem_total / 1024, 3)
            })
        return gpu_stats
    except Exception:
        return None

@system_bp.get("/stats")
def get_stats():
    uptime_seconds = time.time() - START_TIME
    uptime_hours = round(uptime_seconds / 3600, 2)

    cpu_backend = backend_process.cpu_percent(interval=0.2)
    mem = backend_process.memory_info()
    ram_backend_gb = round(mem.rss / (1024 ** 3), 3)
    total_ram = psutil.virtual_memory()
    ram_total_gb = round(total_ram.total / (1024 ** 3), 2)

    avg_response_ms = (
        round(TOTAL_RESPONSE_TIME / REQUEST_COUNT, 2)
        if REQUEST_COUNT > 0 else 0
    )

    # Використання GPU твоєю програмою
    gpu_usage_by_process_gb = get_gpu_usage_by_pid(backend_process.pid)

    # Загальне GPU
    gpu_total_stats = get_gpu_total_usage()

    return jsonify({
        "uptime_hours": uptime_hours,
        "requests": REQUEST_COUNT,
        "avg_response_ms": avg_response_ms,
        "cpu_backend": cpu_backend,
        "ram_backend_gb": ram_backend_gb,
        "ram_total_gb": ram_total_gb,
        "network_sent_gb": round(NETWORK_OUT / (1024 ** 3), 4),
        "network_recv_gb": round(NETWORK_IN / (1024 ** 3), 4),
        "gpu_usage_by_process_gb": gpu_usage_by_process_gb,  # пам'ять, яку займає твоя програма
        "gpu_total_stats": gpu_total_stats                   # загальне завантаження GPU
    })
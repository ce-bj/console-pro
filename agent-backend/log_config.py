# -*- coding: utf-8 -*-
"""统一日志配置 — 写入 logs/ 目录，按大小自动轮转。

用法：
    from log_config import get_logger, UVICORN_LOG_CONFIG
    logger = get_logger(__name__)
"""
import logging
import os
from logging.handlers import RotatingFileHandler

_LOGS_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(_LOGS_DIR, exist_ok=True)

_FMT = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
_DATE_FMT = "%Y-%m-%d %H:%M:%S"

# 最大 10 MB，保留 5 个历史文件
_MAX_BYTES = 10 * 1024 * 1024
_BACKUP_COUNT = 5


def _make_handler(filename: str) -> RotatingFileHandler:
    path = os.path.join(_LOGS_DIR, filename)
    handler = RotatingFileHandler(
        path, maxBytes=_MAX_BYTES, backupCount=_BACKUP_COUNT, encoding="utf-8"
    )
    handler.setFormatter(logging.Formatter(_FMT, datefmt=_DATE_FMT))
    return handler


def _setup_root() -> None:
    root = logging.getLogger()
    if root.handlers:
        return  # 已初始化，避免重复添加
    root.setLevel(logging.INFO)
    # 控制台
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter(_FMT, datefmt=_DATE_FMT))
    root.addHandler(ch)
    # 文件（应用日志）
    root.addHandler(_make_handler("app.log"))


_setup_root()


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


# ── uvicorn 日志配置（传给 uvicorn.run 的 log_config 参数）────────────────
_ACCESS_LOG = os.path.join(_LOGS_DIR, "access.log")

UVICORN_LOG_CONFIG: dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {"format": _FMT, "datefmt": _DATE_FMT},
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": '%(asctime)s [ACCESS] %(client_addr)s — "%(request_line)s" %(status_code)s',
            "datefmt": _DATE_FMT,
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
        "app_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "default",
            "filename": os.path.join(_LOGS_DIR, "app.log"),
            "maxBytes": _MAX_BYTES,
            "backupCount": _BACKUP_COUNT,
            "encoding": "utf-8",
        },
        "access_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "access",
            "filename": _ACCESS_LOG,
            "maxBytes": _MAX_BYTES,
            "backupCount": _BACKUP_COUNT,
            "encoding": "utf-8",
        },
    },
    "loggers": {
        "uvicorn": {"handlers": ["console", "app_file"], "level": "INFO", "propagate": False},
        "uvicorn.error": {"handlers": ["console", "app_file"], "level": "INFO", "propagate": False},
        "uvicorn.access": {"handlers": ["console", "access_file"], "level": "INFO", "propagate": False},
    },
}

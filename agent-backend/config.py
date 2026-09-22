# -*- coding: utf-8 -*-
"""Configuration loaded from .env"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str | None = os.getenv("LLM_BASE_URL") or None
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-5.5")
    AGENT_PORT: int = int(os.getenv("AGENT_PORT", "8001"))

    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "anvil_demo")
    DB_USER: str = os.getenv("DB_USER", "simon")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "123456")

    LANGFUSE_SECRET_KEY: str = os.getenv("LANGFUSE_SECRET_KEY", "")
    LANGFUSE_PUBLIC_KEY: str = os.getenv("LANGFUSE_PUBLIC_KEY", "")
    LANGFUSE_BASE_URL: str = os.getenv("LANGFUSE_BASE_URL", "https://cloud.langfuse.com")
    LANGFUSE_PROJECT_ID: str = os.getenv("LANGFUSE_PROJECT_ID", "")
    LANGFUSE_TRACE_SAMPLE_RATE: float = float(os.getenv("LANGFUSE_TRACE_SAMPLE_RATE", "1.0"))
    LANGFUSE_REDACT_PII: bool = os.getenv("LANGFUSE_REDACT_PII", "true").lower() not in {"0", "false", "no"}
    KB_VERSION: str = os.getenv("KB_VERSION", "")


settings = Settings()

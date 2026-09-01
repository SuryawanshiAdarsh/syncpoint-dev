from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the AI service.

    Environment variables map by name (e.g. ``LLM_PROVIDER``).
    """

    llm_provider: str = "stub"
    llm_api_key: str = ""
    llm_model: str = "stub-1"

    embedding_provider: str = "stub"
    embedding_model: str = "stub-embed-1"

    qdrant_url: str = "http://qdrant:6333"
    prompt_version: str = "evidence-mapping/v1"

    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

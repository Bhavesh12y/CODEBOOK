from __future__ import annotations

from abc import ABC, abstractmethod
import json
import os
from typing import Protocol
from urllib import error, parse, request


DEFAULT_USER_AGENT = "CppBook/1.0 (local desktop; +https://localhost)"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


class CellContext(Protocol):
    notebook_id: str
    cell_id: str
    source: str


def discover_best_groq_model(api_key: str = "") -> str:
    key = api_key.strip()
    if not key:
        return DEFAULT_GROQ_MODEL
    req = request.Request(
        "https://api.groq.com/openai/v1/models",
        method="GET",
        headers=_http_headers(authorization=f"Bearer {key}", json_body=False),
    )
    try:
        data = _open_json(req, timeout=8)
        models = {
            item.get("id")
            for item in data.get("data", [])
            if isinstance(item, dict) and item.get("id")
        }
        priority = [
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "llama-3.3-70b-versatile",
            "qwen/qwen3.6-27b",
            "groq/compound",
            "llama-3.3-70b-specdec",
            "llama-3.2-3b-preview",
            "llama-3.2-1b-preview",
            "llama-3.2-11b-vision-preview",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
            "qwen-2.5-32b",
        ]
        for p in priority:
            if p in models:
                return p
        for m in models:
            if not any(x in m for x in ["whisper", "guard", "safeguard", "orpheus", "compound-mini"]):
                return m
    except Exception:
        pass
    return DEFAULT_GROQ_MODEL


def discover_best_gemini_model(api_key: str = "") -> str:
    key = api_key.strip()
    if not key:
        return DEFAULT_GEMINI_MODEL
    encoded_key = parse.quote(key, safe="")
    req = request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models?key={encoded_key}",
        method="GET",
        headers=_http_headers(json_body=False, extra={"x-goog-api-key": key}),
    )
    try:
        data = _open_json(req, timeout=8)
        raw_models = {
            item.get("name", "").replace("models/", "")
            for item in data.get("models", [])
            if isinstance(item, dict) and "generateContent" in item.get("supportedGenerationMethods", [])
        }
        priority = [
            "gemini-2.5-flash",
            "gemini-3.6-flash",
            "gemini-2.5-pro",
            "gemini-3.7-flash",
            "gemini-flash-latest",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
        ]
        for p in priority:
            if p in raw_models:
                return p
    except Exception:
        pass
    return DEFAULT_GEMINI_MODEL


def _normalize_gemini_model(model: str = "", api_key: str = "") -> str:
    return discover_best_gemini_model(api_key)


def _normalize_groq_model(model: str = "", api_key: str = "") -> str:
    return discover_best_groq_model(api_key)


class AIService(ABC):
    """Interface for optional AI features.

    The core notebook never depends on an AI provider. Implementations can read
    provider credentials from environment variables and be registered later.
    """

    @abstractmethod
    async def explain_cell(self, context: CellContext) -> str:
        raise NotImplementedError

    @abstractmethod
    async def fix_error(self, context: CellContext, stderr: str) -> str:
        raise NotImplementedError

    @abstractmethod
    async def optimize_cell(self, context: CellContext) -> str:
        raise NotImplementedError

    @abstractmethod
    async def enhance_cell(self, context: CellContext) -> str:
        raise NotImplementedError

    @abstractmethod
    async def chat(self, messages: list[dict[str, str]], notebook_source: str) -> str:
        raise NotImplementedError


class DisabledAIService(AIService):
    async def explain_cell(self, context: CellContext) -> str:
        raise RuntimeError("AI agent is disabled. Add Groq or Gemini credentials in Settings > AI Provider.")

    async def fix_error(self, context: CellContext, stderr: str) -> str:
        raise RuntimeError("AI agent is disabled. Add Groq or Gemini credentials in Settings > AI Provider.")

    async def optimize_cell(self, context: CellContext) -> str:
        raise RuntimeError("AI agent is disabled. Add Groq or Gemini credentials in Settings > AI Provider.")

    async def enhance_cell(self, context: CellContext) -> str:
        raise RuntimeError("AI agent is disabled. Add Groq or Gemini credentials in Settings > AI Provider.")

    async def chat(self, messages: list[dict[str, str]], notebook_source: str) -> str:
        raise RuntimeError("AI agent is disabled. Add Groq or Gemini credentials in Settings > AI Provider.")


def _http_headers(*, authorization: str | None = None, extra: dict[str, str] | None = None, json_body: bool = True) -> dict[str, str]:
    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "application/json",
    }
    if json_body:
        headers["Content-Type"] = "application/json"
    if authorization:
        headers["Authorization"] = authorization
    if extra:
        headers.update(extra)
    return headers


class _HttpDetail(Exception):
    def __init__(self, code: int, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


def _open_json(req: request.Request, *, timeout: float) -> dict:
    try:
        with request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8", errors="replace"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise _HttpDetail(exc.code, detail) from exc


def _raise_provider_http(provider_name: str, exc: Exception) -> None:
    if isinstance(exc, _HttpDetail):
        code = exc.code
        detail = exc.detail
    elif isinstance(exc, error.HTTPError):
        code = exc.code
        try:
            detail = exc.read().decode("utf-8", errors="replace")
        except Exception:
            detail = str(exc)
    else:
        raise RuntimeError(f"{provider_name}: {exc}") from exc
    cleaned = _safe_provider_error(detail)
    if code == 403 and ("1010" in detail or "error code: 1010" in cleaned.lower()):
        raise RuntimeError(
            f"{provider_name} blocked the request (Cloudflare 1010). "
            "CppBook now sends a browser-like User-Agent. Retry Test Connection."
        ) from exc
    raise RuntimeError(f"{provider_name} HTTP {code}: {cleaned}") from exc


def _raise_provider_network(provider_name: str, exc: error.URLError) -> None:
    reason = str(exc.reason)
    if "10013" in reason or "forbidden by its access permissions" in reason:
        raise RuntimeError(
            f"{provider_name} unreachable: Windows blocked the network socket (WinError 10013). "
            "Allow CppBook, python, or the packaged backend through Windows Firewall/security software, "
            "then retry from Settings > AI Provider."
        ) from exc
    raise RuntimeError(f"{provider_name} unreachable: {reason}") from exc


class OpenAICompatibleService(AIService):
    def __init__(
        self,
        api_key: str,
        endpoint: str,
        model: str,
        provider_name: str = "AI provider",
        runtime_context: str = "",
    ) -> None:
        self.api_key = api_key.strip()
        self.endpoint = endpoint.rstrip("/")
        self.model = model
        self.provider_name = provider_name
        self.runtime_context = runtime_context.strip()

    def _assistant_rules(self) -> str:
        rules = (
            "You are ChatGPT, an expert AI assistant for C++ and DSA in CppBook.\n"
            "Style & Guidelines:\n"
            "- Be concise, direct, helpful, and natural like ChatGPT.\n"
            "- Strictly respect the user's intent, coding preferences, and instructions.\n"
            "- When providing code, always provide clean, runnable C++ in a fenced ```cpp``` block.\n"
            "- Do not give unsolicited lectures or scold the user for their coding style (e.g., `using namespace std;`). Follow what the user wants."
        )
        if self.runtime_context:
            return f"Environment:\n{self.runtime_context}\n\n{rules}"
        return rules

    async def explain_cell(self, context: CellContext) -> str:
        prompt = (
            "Explain this C++ notebook cell clearly and concisely. "
            "Highlight what the code does, key STL/data structures used, and practical tips.\n\n"
            f"Code:\n{context.source}"
        )
        return self._complete(prompt)

    async def fix_error(self, context: CellContext, stderr: str) -> str:
        prompt = (
            "Fix the following C++ code that generated a compilation or runtime error. "
            "Provide the exact root cause, followed by the complete working fixed code in a ```cpp``` block.\n\n"
            f"Code:\n{context.source}\n\nCompiler / Error Output:\n{stderr}"
        )
        return self._complete(prompt)

    async def optimize_cell(self, context: CellContext) -> str:
        prompt = (
            "Optimize this C++ code for better time/space complexity and modern C++ readability. "
            "Return the optimized code in one fenced ```cpp``` block, followed by Time & Space complexity analysis and brief bullet points.\n\n"
            f"Code:\n{context.source}"
        )
        return self._complete(prompt)

    async def enhance_cell(self, context: CellContext) -> str:
        prompt = (
            "Enhance this C++ code: clean up formatting, ensure proper standard headers, and apply idiomatic C++ best practices. "
            "Return the complete enhanced code in one fenced ```cpp``` block.\n\n"
            f"Code:\n{context.source}"
        )
        return self._complete(prompt)

    async def chat(self, messages: list[dict[str, str]], notebook_source: str) -> str:
        system = self._assistant_rules()
        if notebook_source.strip():
            system += f"\n\nActive Notebook Code:\n{notebook_source}"
        payload_messages = [{"role": "system", "content": system}, *messages]
        return self._complete_messages(payload_messages)

    def _complete(self, prompt: str) -> str:
        return self._complete_messages(
            [
                {"role": "system", "content": self._assistant_rules()},
                {"role": "user", "content": prompt},
            ]
        )

    def _complete_messages(self, messages: list[dict[str, str]], fallback_attempted: bool = False) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_completion_tokens": 2048,
        }
        req = request.Request(
            f"{self.endpoint}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers=_http_headers(authorization=f"Bearer {self.api_key}"),
        )
        try:
            body = _open_json(req, timeout=45)
            choices = body.get("choices") or []
            if not choices:
                raise RuntimeError("AI provider returned no choices.")
            message = choices[0].get("message") or {}
            content = message.get("content")
            if isinstance(content, str) and content.strip():
                return content.strip()
            # Reasoning models (e.g. gpt-oss) may put draft text in `reasoning`.
            reasoning = message.get("reasoning")
            if isinstance(reasoning, str) and reasoning.strip():
                return reasoning.strip()
            raise RuntimeError("AI provider returned an empty response.")
        except (error.HTTPError, _HttpDetail) as exc:
            # Automatic fallback to lighter model if 70b was rate limited or failed
            if not fallback_attempted and self.model != FALLBACK_GROQ_MODEL and self.provider_name == "Groq":
                self.model = FALLBACK_GROQ_MODEL
                return self._complete_messages(messages, fallback_attempted=True)
            _raise_provider_http(self.provider_name, exc)
            raise
        except error.URLError as exc:
            _raise_provider_network(self.provider_name, exc)
            raise
        except TimeoutError as exc:
            raise RuntimeError(
                f"{self.provider_name} timed out. Check your internet connection, then try again."
            ) from exc


class GeminiNativeService(OpenAICompatibleService):
    def __init__(self, api_key: str, model: str = "", runtime_context: str = "") -> None:
        super().__init__(
            api_key=api_key,
            endpoint="https://generativelanguage.googleapis.com/v1beta",
            model=_normalize_gemini_model(model, api_key),
            provider_name="Gemini",
            runtime_context=runtime_context,
        )

    def _complete_messages(self, messages: list[dict[str, str]]) -> str:
        system_parts: list[dict[str, str]] = []
        contents: list[dict[str, object]] = []
        for message in messages:
            content = str(message.get("content") or "")
            if not content.strip():
                continue
            role = message.get("role")
            if role == "system":
                system_parts.append({"text": content})
            else:
                contents.append(
                    {
                        "role": "model" if role == "assistant" else "user",
                        "parts": [{"text": content}],
                    }
                )
        payload: dict[str, object] = {
            "contents": contents or [{"role": "user", "parts": [{"text": "Hello"}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048},
        }
        if system_parts:
            payload["system_instruction"] = {"parts": system_parts}
        key = parse.quote(self.api_key, safe="")
        req = request.Request(
            f"{self.endpoint}/models/{parse.quote(self.model, safe='')}:generateContent?key={key}",
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers=_http_headers(extra={"x-goog-api-key": self.api_key}),
        )
        try:
            body = _open_json(req, timeout=45)
            candidates = body.get("candidates") or []
            if not candidates:
                feedback = body.get("promptFeedback") or {}
                block_reason = feedback.get("blockReason")
                if block_reason:
                    raise RuntimeError(f"Gemini blocked the request: {block_reason}")
                raise RuntimeError("Gemini returned no candidates.")
            parts = ((candidates[0].get("content") or {}).get("parts") or [])
            text = "".join(part.get("text", "") for part in parts if isinstance(part, dict)).strip()
            if text:
                return text
            raise RuntimeError("Gemini returned an empty response.")
        except error.HTTPError as exc:
            _raise_provider_http("Gemini", exc)
            raise
        except _HttpDetail as exc:
            _raise_provider_http("Gemini", exc)
            raise
        except error.URLError as exc:
            _raise_provider_network("Gemini", exc)
            raise
        except TimeoutError as exc:
            raise RuntimeError("Gemini timed out. Check the model, API key, and internet connection, then try again.") from exc


def _safe_provider_error(detail: str) -> str:
    """Return useful provider failure detail without leaking credentials."""
    raw = detail.strip()
    if "error code: 1010" in raw.lower() or raw.strip() == "error code: 1010":
        return "Cloudflare blocked the request (error code 1010). Retry after CppBook User-Agent fix."
    try:
        payload = json.loads(detail)
        error_payload = payload.get("error", payload)
        if isinstance(error_payload, list) and error_payload:
            error_payload = error_payload[0].get("error", error_payload[0])
        message = error_payload.get("message") if isinstance(error_payload, dict) else None
        status = error_payload.get("status") if isinstance(error_payload, dict) else None
        if message and status:
            return f"{status}: {message}"[:400]
        if message:
            return str(message)[:400]
    except Exception:
        pass
    return detail.replace("\n", " ")[:400]


def build_runtime_context(*, compiler_name: str | None, compiler_version: str | None, compiler_path: str | None, cpp_standard: str) -> str:
    name = (compiler_name or "unknown").strip()
    version = (compiler_version or "").strip()
    path = (compiler_path or "n/a").strip()
    return "\n".join(
        [
            f"- C++ Dialect Standard: -std={cpp_standard} (Default C++17)",
            f"- Toolchain / Compiler: {name} {version}".rstrip(),
            f"- Compiler Location: {path}",
            "- Environment: CppBook interactive notebook (cell-by-cell execution with automatic header inclusion and replay)",
            "- Scoping Model: Ordinary variable declarations are scoped locally to their cell; functions, structs, classes, templates, and static variables persist across cells",
            "- Focus: C++ beginners, students, and LeetCode/DSA problem solvers",
            "- Toolchain Constraint: Only use headers and features supported by the reported compiler and dialect flag (do not suggest unsupported APIs or C++20 features when on C++17)",
        ]
    )


def create_ai_service() -> AIService:
    api_key = os.getenv("CPPBOOK_AI_API_KEY", "").strip()
    if not api_key:
        return DisabledAIService()
    endpoint = os.getenv("CPPBOOK_AI_BASE_URL", "https://api.openai.com/v1").strip()
    model = os.getenv("CPPBOOK_AI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    return OpenAICompatibleService(api_key=api_key, endpoint=endpoint, model=model)


def create_ai_service_from_request(
    *,
    enabled: bool,
    provider: str = "groq",
    groq_api_key: str = "",
    gemini_api_key: str = "",
    groq_model: str = DEFAULT_GROQ_MODEL,
    gemini_model: str = DEFAULT_GEMINI_MODEL,
    legacy_model: str = "",
    legacy_api_keys: list[str] | None = None,
    runtime_context: str = "",
) -> AIService:
    del provider  # Provider order is always Groq then Gemini fallback.
    groq_key = groq_api_key.strip()
    gemini_key = gemini_api_key.strip()
    legacy_keys = [key.strip() for key in (legacy_api_keys or []) if key.strip()]
    if not gemini_key and legacy_keys:
        gemini_key = legacy_keys[0]
    if not enabled or (not groq_key and not gemini_key):
        return DisabledAIService()
    groq_requested_model = _normalize_groq_model(groq_model, groq_key)
    gemini_requested_model = _normalize_gemini_model(gemini_model or legacy_model, gemini_key)

    services: list[AIService] = []
    if groq_key:
        services.append(
            OpenAICompatibleService(
                api_key=groq_key,
                endpoint="https://api.groq.com/openai/v1",
                model=groq_requested_model,
                provider_name="Groq",
                runtime_context=runtime_context,
            )
        )
    if gemini_key:
        services.append(
            GeminiNativeService(
                api_key=gemini_key,
                model=gemini_requested_model,
                runtime_context=runtime_context,
            )
        )
    return FallbackAIService(services)


def create_ai_service_for_provider(
    *,
    provider: str,
    api_key: str,
    model: str = "",
    runtime_context: str = "",
) -> AIService:
    key = api_key.strip()
    if not key:
        return DisabledAIService()
    if provider == "gemini":
        return GeminiNativeService(
            api_key=key,
            model=_normalize_gemini_model(model, key),
            runtime_context=runtime_context,
        )
    return OpenAICompatibleService(
        api_key=key,
        endpoint="https://api.groq.com/openai/v1",
        model=_normalize_groq_model(model, key),
        provider_name="Groq",
        runtime_context=runtime_context,
    )


def probe_ai_provider_key(*, provider: str, api_key: str) -> str:
    key = api_key.strip()
    if not key:
        raise RuntimeError("Paste an API key first.")
    if provider == "gemini":
        encoded_key = parse.quote(key, safe="")
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={encoded_key}"
        req = request.Request(
            url,
            method="GET",
            headers=_http_headers(json_body=False, extra={"x-goog-api-key": key}),
        )
    else:
        req = request.Request(
            "https://api.groq.com/openai/v1/models",
            method="GET",
            headers=_http_headers(authorization=f"Bearer {key}", json_body=False),
        )
    try:
        _open_json(req, timeout=20)
        return f"{provider.title()} key is valid."
    except error.HTTPError as exc:
        _raise_provider_http(provider.title(), exc)
        raise
    except _HttpDetail as exc:
        _raise_provider_http(provider.title(), exc)
        raise
    except error.URLError as exc:
        raise RuntimeError(f"{provider.title()} key check unreachable: {exc.reason}") from exc


class FallbackAIService(AIService):
    def __init__(self, services: list[AIService]) -> None:
        self.services = services

    async def explain_cell(self, context: CellContext) -> str:
        return await self._try(lambda service: service.explain_cell(context))

    async def fix_error(self, context: CellContext, stderr: str) -> str:
        return await self._try(lambda service: service.fix_error(context, stderr))

    async def optimize_cell(self, context: CellContext) -> str:
        return await self._try(lambda service: service.optimize_cell(context))

    async def enhance_cell(self, context: CellContext) -> str:
        return await self._try(lambda service: service.enhance_cell(context))

    async def chat(self, messages: list[dict[str, str]], notebook_source: str) -> str:
        return await self._try(lambda service: service.chat(messages, notebook_source))

    async def _try(self, operation) -> str:
        errors: list[str] = []
        for service in self.services:
            try:
                return await operation(service)
            except RuntimeError as exc:
                errors.append(str(exc))
        raise RuntimeError("All configured AI providers failed. " + " | ".join(errors[-2:]))

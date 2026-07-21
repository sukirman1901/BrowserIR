# bir/sdk/python/src/bir/client.py
import json
import asyncio
import websockets
from typing import Any, AsyncIterator
from pydantic import BaseModel

class BIRClientOptions(BaseModel):
    host: str = "localhost"
    port: int = 3080

class BIRClient:
    def __init__(self, host: str = "localhost", port: int = 3080):
        self.host = host
        self.port = port
        self._ws = None
        self._pending = {}
        self._event_callbacks = []

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, *args):
        await self.disconnect()

    async def connect(self):
        self._ws = await websockets.connect(f"ws://{self.host}:{self.port}")
        asyncio.create_task(self._listen())

    async def _listen(self):
        async for message in self._ws:
            msg = json.loads(message)
            if msg.get("id") and msg["id"] in self._pending:
                future = self._pending.pop(msg["id"])
                if "error" in msg:
                    future.set_exception(Exception(msg["error"]["message"]))
                else:
                    future.set_result(msg["result"])
            elif msg.get("type") == "event":
                for cb in self._event_callbacks:
                    cb(msg["data"])

    async def rpc(self, method: str, params: dict = None) -> Any:
        msg_id = str(id(object()))
        future = asyncio.get_event_loop().create_future()
        self._pending[msg_id] = future
        await self._ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        return await future

    async def explain(self, url: str = None):
        if url:
            await self.rpc("navigate", {"url": url})
        return await self.rpc("explain")

    async def screenshot(self):
        return await self.rpc("screenshot")

    async def click(self, ref: str):
        return await self.rpc("click", {"ref": ref})

    @property
    def memory(self):
        return MemoryAPI(self)

    @property
    def planner(self):
        return PlannerAPI(self)

    @property
    def agents(self):
        return AgentsAPI(self)

    def on_event(self, callback):
        self._event_callbacks.append(callback)

    async def events(self) -> AsyncIterator[dict]:
        queue = asyncio.Queue()
        self._event_callbacks.append(queue.put)
        try:
            while True:
                yield await queue.get()
        finally:
            self._event_callbacks.remove(queue.put)

    async def disconnect(self):
        if self._ws:
            await self._ws.close()


class MemoryAPI:
    def __init__(self, client: BIRClient):
        self._client = client

    async def recall(self, domain: str):
        return await self._client.rpc("memory.recall", {"domain": domain})

    async def store(self, domain: str, knowledge: dict):
        return await self._client.rpc("memory.store", {"domain": domain, "knowledge": knowledge})


class PlannerAPI:
    def __init__(self, client: BIRClient):
        self._client = client

    async def create(self, goal: str, domain: str):
        return await self._client.rpc("planner.create", {"goal": goal, "domain": domain})

    async def execute(self, plan_id: str):
        return await self._client.rpc("planner.execute", {"planId": plan_id})

    async def status(self, plan_id: str):
        return await self._client.rpc("planner.status", {"planId": plan_id})


class AgentsAPI:
    def __init__(self, client: BIRClient):
        self._client = client

    async def register(self, name: str, role: str, session_id: str):
        return await self._client.rpc("agent.register", {"name": name, "role": role, "sessionId": session_id})

    async def unregister(self, agent_id: str):
        return await self._client.rpc("agent.unregister", {"id": agent_id})

    async def claim(self, agent_id: str, action: dict):
        return await self._client.rpc("agent.claim", {"agentId": agent_id, **action})

    async def graph(self):
        return await self._client.rpc("agent.graph")

# bir/sdk/python/tests/test_client.py
import pytest
from bir import BIRClient

def test_create_client():
    client = BIRClient()
    assert client is not None

def test_create_client_with_port():
    client = BIRClient(port=4000)
    assert client.port == 4000

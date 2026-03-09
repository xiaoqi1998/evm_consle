import ipaddress
import json
import socket
import time
from collections.abc import Mapping
from functools import wraps

from flask import g, jsonify, request
from hexbytes import HexBytes
from sqlalchemy.exc import OperationalError
from web3 import Web3

import config as global_config
from extensions import db
from models import Abi, CallHistory, User


def retry_on_db_error(max_retries=3, delay=1):
    """Retry DB operations for transient connection loss."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except OperationalError as exc:
                    last_exception = exc
                    msg = str(exc)
                    if (
                        "Lost connection" in msg
                        or "MySQL server has gone away" in msg
                    ) and attempt < max_retries - 1:
                        time.sleep(delay)
                        continue
                    raise
            raise last_exception

        return wrapper

    return decorator


def create_response(data=None, message="Success", status_code=200, error=None, details=None):
    payload = {
        "status": "success" if error is None else "error",
        "message": message,
    }
    if data is not None:
        payload["data"] = data
    if error is not None:
        payload["error"] = error
    if details is not None:
        payload["details"] = details

    response = jsonify(payload)
    response.status_code = status_code
    return response


def get_current_username():
    return getattr(g, "user_username", None)


def convert_to_json_serializable(obj):
    if isinstance(obj, HexBytes):
        return obj.hex()
    if isinstance(obj, bytes):
        return "0x" + obj.hex()
    if isinstance(obj, Mapping):
        return {k: convert_to_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_to_json_serializable(v) for v in obj]
    if isinstance(obj, tuple):
        return [convert_to_json_serializable(v) for v in obj]
    return obj


def cast_value_by_abi_type(value, abi_type, components=None):
    if abi_type.startswith("uint") or abi_type.startswith("int"):
        if isinstance(value, str):
            if value.strip() == "":
                return 0
            if value.startswith("0x"):
                return int(value, 16)
            return int(value)
        return int(value) if value is not None else 0

    if abi_type == "bool":
        if isinstance(value, str):
            return value.lower() in ("true", "1", "yes", "on")
        return bool(value)

    if abi_type == "address":
        return str(value)

    if abi_type.endswith("[]"):
        subtype = abi_type[:-2]
        if not isinstance(value, list):
            raise ValueError(f"Expected array for type {abi_type}")
        return [cast_value_by_abi_type(v, subtype, components) for v in value]

    if abi_type.startswith("tuple"):
        if not components:
            return value
        if isinstance(value, dict):
            # Keep ABI components order.
            return [
                cast_value_by_abi_type(value.get(c["name"]), c.get("type", ""), c.get("components"))
                for c in components
            ]
        if isinstance(value, (list, tuple)):
            return [
                cast_value_by_abi_type(value[i], c.get("type", ""), c.get("components"))
                for i, c in enumerate(components)
            ]
        return value

    if abi_type.startswith("bytes"):
        if isinstance(value, str) and value.startswith("0x"):
            return bytes.fromhex(value[2:])
        if isinstance(value, str):
            return value.encode("utf-8")
        return value

    return value


def cast_args_by_abi(inputs_abi, args):
    if len(inputs_abi) != len(args):
        return args

    casted_args = []
    for i, input_def in enumerate(inputs_abi):
        val = args[i]
        arg_type = input_def.get("type", "")
        casted_args.append(cast_value_by_abi_type(val, arg_type, input_def.get("components")))
    return casted_args


def get_user_accounts():
    username = get_current_username()
    if not username:
        return {}

    user = User.query.filter_by(username=username).first()
    if not user:
        return {}

    accounts = {}
    for acc in user.accounts:
        item = {"address": acc.address}
        if hasattr(acc, "pk_slice_server"):
            item["pk_slice_server"] = acc.pk_slice_server
        accounts[acc.alias] = item
    return accounts


def save_call_history(username, method_type, contract, method, args, result=None, error=None, chain_id=None, abi_name=None):
    user = User.query.filter_by(username=username).first()
    if not user:
        return

    from secrets import token_hex

    entry = CallHistory(
        user_id=user.id,
        call_id=token_hex(4),
        type=method_type,
        contract=contract,
        method=method,
        args=convert_to_json_serializable(args),
        result=convert_to_json_serializable(result) if result is not None else None,
        error=str(error) if error else None,
        chain_id=chain_id,
        abi_name=abi_name,
    )
    db.session.add(entry)
    db.session.commit()


def get_user_rpcs():
    rpcs_map = {}

    for chain_id, conf in global_config.TESTNET_RPC_URLS.items():
        url = conf["rpc_url"]
        alias = conf.get("alias")
        rpcs_map[str(chain_id)] = url
        if alias:
            rpcs_map[alias] = url

    username = get_current_username()
    if username:
        user = User.query.filter_by(username=username).first()
        if user:
            for rpc in user.rpcs:
                rpcs_map[str(rpc.chain_id)] = rpc.rpc_url
                if rpc.alias:
                    rpcs_map[rpc.alias] = rpc.rpc_url

    return rpcs_map


def _is_blocked_ip(ip_obj):
    return (
        ip_obj.is_private
        or ip_obj.is_loopback
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
        or str(ip_obj) == "169.254.169.254"
    )


def is_safe_public_rpc_url(url):
    from urllib.parse import urlparse

    try:
        parsed = urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in ("http", "https"):
        return False

    hostname = parsed.hostname.lower() if parsed.hostname else None
    if not hostname:
        return False

    if hostname in ("localhost", "metadata.google.internal"):
        return False

    try:
        ip_obj = ipaddress.ip_address(hostname)
        return not _is_blocked_ip(ip_obj)
    except ValueError:
        pass

    try:
        resolved = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False

    for entry in resolved:
        ip_obj = ipaddress.ip_address(entry[4][0])
        if _is_blocked_ip(ip_obj):
            return False

    return True


def get_web3_instance(data):
    chain_id = data.get("chain_id")
    chain_alias = data.get("chain_alias")
    rpc_url = data.get("rpc_url")

    if rpc_url and not is_safe_public_rpc_url(rpc_url):
        return None, None, create_response(
            error="SSRF_BLOCKED",
            details="Forbidden local/internal RPC URL",
            status_code=403,
        )

    user_rpcs = get_user_rpcs()
    target_url = None

    if rpc_url:
        target_url = rpc_url
    elif chain_alias and chain_alias in user_rpcs:
        target_url = user_rpcs[chain_alias]
    elif chain_id is not None and str(chain_id) in user_rpcs:
        target_url = user_rpcs[str(chain_id)]

    if target_url and not is_safe_public_rpc_url(target_url):
        return None, None, create_response(
            error="SSRF_BLOCKED",
            details="Forbidden local/internal RPC URL",
            status_code=403,
        )

    if not target_url:
        return None, None, create_response(
            error="Invalid configuration",
            details=f"No valid RPC for chain_id='{chain_id}'",
            status_code=400,
        )

    w3 = Web3(Web3.HTTPProvider(target_url))
    if not w3.is_connected():
        return None, None, create_response(
            error="RPC_CONNECTION_FAILED",
            details=f"RPC connection failed: {target_url}",
            status_code=503,
        )

    return w3, target_url, None


def load_abi(abi_name):
    username = get_current_username()
    if not username:
        raise PermissionError("User not authenticated")

    user = User.query.filter_by(username=username).first()
    if user:
        abi = Abi.query.filter_by(user_id=user.id, name=abi_name).first()
        if abi:
            return abi.content

    raise FileNotFoundError(f"ABI '{abi_name}' not found.")


def login_required_or_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get("X-API-Token")
        if token:
            user = User.query.filter_by(token=token).first()
            if user:
                if user.is_disabled:
                    return create_response(status_code=403, error="AccountDisabled", details="Account is disabled.")
                g.user_username = user.username
                return f(*args, **kwargs)

        return create_response(
            status_code=401,
            error="Unauthorized",
            details="Authentication required via X-API-Token header.",
        )

    return decorated_function


def validate_json_input(schema):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return create_response(
                    error="Invalid Content-Type",
                    details="Request must be JSON",
                    status_code=400,
                )

            data = request.get_json()
            if not data:
                return create_response(error="Empty JSON body", status_code=400)

            for key, expected_type in schema.items():
                if key not in data:
                    return create_response(
                        error="Missing parameter",
                        details=f"Missing required field: {key}",
                        status_code=400,
                    )

                value = data[key]
                if isinstance(expected_type, tuple):
                    if not isinstance(value, expected_type):
                        type_names = ", ".join([t.__name__ for t in expected_type])
                        return create_response(
                            error="Invalid parameter type",
                            details=f"Field '{key}' must be one of: {type_names}",
                            status_code=400,
                        )
                else:
                    if not isinstance(value, expected_type):
                        return create_response(
                            error="Invalid parameter type",
                            details=f"Field '{key}' must be {expected_type.__name__}",
                            status_code=400,
                        )

            return f(*args, **kwargs)

        return decorated_function

    return decorator

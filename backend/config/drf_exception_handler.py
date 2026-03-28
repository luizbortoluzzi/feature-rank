"""
Custom DRF exception handler.

All error responses conform to the project API contract envelope:

    {
        "error": {
            "code": "<machine-readable string>",
            "message": "<human-readable string>",
            "details": <object | null>
        }
    }

Internal detail (stack traces, raw DB errors) is never exposed in responses.
"""

import logging

from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_default_exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Wraps DRF exceptions into the project error envelope.

    Falls back to DRF's default handler first so that authentication and
    permission negotiation (e.g., WWW-Authenticate headers) is still applied.
    Returns None for non-DRF exceptions so Django's error handling can proceed.
    """
    # Let DRF handle the response internals (headers, auth challenges, etc.)
    response = drf_default_exception_handler(exc, context)

    if response is None:
        # Non-DRF exception (e.g., unhandled Python error).
        # Log the traceback but return a safe generic 500.
        logger.exception("Unhandled exception in API view: %s", exc)
        return Response(
            {
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "details": None,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, ValidationError):
        data = {
            "error": {
                "code": "validation_error",
                "message": "Request body is invalid.",
                "details": exc.detail,
            }
        }
        response.data = data
        return response

    if isinstance(exc, NotAuthenticated | AuthenticationFailed):
        data = {
            "error": {
                "code": "unauthorized",
                "message": "Authentication credentials were not provided or are invalid.",
                "details": None,
            }
        }
        response.data = data
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return response

    if isinstance(exc, PermissionDenied):
        data = {
            "error": {
                "code": "forbidden",
                "message": "You do not have permission to perform this action.",
                "details": None,
            }
        }
        response.data = data
        response.status_code = status.HTTP_403_FORBIDDEN
        return response

    if isinstance(exc, NotFound):
        data = {
            "error": {
                "code": "not_found",
                "message": "The requested resource was not found.",
                "details": None,
            }
        }
        response.data = data
        response.status_code = status.HTTP_404_NOT_FOUND
        return response

    # All other DRF exceptions — return a safe generic error body.
    logger.warning("Unhandled DRF exception (%s): %s", type(exc).__name__, exc)
    data = {
        "error": {
            "code": "error",
            "message": "An error occurred while processing your request.",
            "details": None,
        }
    }
    response.data = data
    return response

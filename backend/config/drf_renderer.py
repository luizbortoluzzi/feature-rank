"""
Custom DRF renderer.

Wraps every successful API response in the project envelope:

    {
        "data": <payload>,
        "meta": null
    }

Paginated responses produced by pagination classes already contain a top-level
structure with "data" and "meta" keys (enforced by the custom pagination class
that will be implemented when list endpoints are built). This renderer only
wraps responses that have not already been enveloped.

The renderer does not wrap error responses — those are handled by the custom
exception handler in drf_exception_handler.py which writes directly to
response.data.
"""

from rest_framework.renderers import JSONRenderer


class EnvelopeRenderer(JSONRenderer):
    """
    Renders successful API responses inside the standard envelope:
        { "data": ..., "meta": null }

    Responses that already contain an "error" key (produced by the custom
    exception handler) are passed through unchanged.

    Responses that already contain both "data" and "meta" keys (produced by
    custom pagination classes) are also passed through unchanged to avoid
    double-wrapping.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if data is not None and isinstance(data, dict):
            if "error" in data:
                # Already an error envelope — pass through.
                return super().render(data, accepted_media_type, renderer_context)
            if "data" in data and "meta" in data:
                # Already a full envelope (e.g., from a paginated list selector).
                return super().render(data, accepted_media_type, renderer_context)

        wrapped = {"data": data, "meta": None}
        return super().render(wrapped, accepted_media_type, renderer_context)

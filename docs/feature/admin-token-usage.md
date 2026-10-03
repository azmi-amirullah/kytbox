# Admin AI Usage

The admin portal's Token Usage tab shows global and per-user AI scan counts plus input and output token totals. Select a user to view activity grouped by calendar date or month. Dates use the `Asia/Jakarta` timezone.

Gemini token counts come from [`usageMetadata.promptTokenCount` and `usageMetadata.candidatesTokenCount`](https://ai.google.dev/api/generate-content). Each successful Gemini HTTP response increments the scan count. If a response omits valid usage metadata, the scan is still counted and its token values are recorded as zero; the missing metadata is reported to Sentry.

Tracking begins when the `20261003035543_admin_ai_token_usage.sql` migration is applied. Earlier usage cannot be reconstructed. The database stores daily per-user rollups; receipt images, prompts, model responses, and per-request records are not retained for this feature.

The daily usage table has no client access policies. A server-side service-role function records counts, while admin-checked RPCs return the paginated global user list and selected user's daily or monthly history.

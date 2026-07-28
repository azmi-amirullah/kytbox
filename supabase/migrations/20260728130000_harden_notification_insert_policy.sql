-- Notifications are created by the server-side service-role client only.
-- Public clients must not be able to forge notifications for another user.
DROP POLICY IF EXISTS "Users or system insert notifications"
  ON public.notifications;

REVOKE INSERT ON TABLE public.notifications FROM anon, authenticated, public;
GRANT INSERT ON TABLE public.notifications TO service_role;

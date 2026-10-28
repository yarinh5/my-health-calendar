# Project rules
- Native iOS uses bundled Vite assets; run the production build and Capacitor sync on the release Mac so signed releases contain current code.
- Keep native URL/session handling in NativeBridge and recovery URL validation in recoveryLinks; accept only the configured HTTPS recovery host and path.
- Appointment image extraction runs only in an authenticated Edge Function through Lovable AI Gateway; return draft fields and require explicit human confirmation in the form.
- Keep extraction photos transient, never store them in appointment records or logs, and propagate cancellation to the gateway.
- Keep iOS deployment settings compatible with installed Capacitor packages and configure Apple signing credentials locally, never in the repository.
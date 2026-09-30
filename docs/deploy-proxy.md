# Reverse proxy notes (nginx / Caddy)

Put TLS termination and HTTP→HTTPS redirect in front of the `web` container (`127.0.0.1:3000` or a Docker network).

## Requirements

- **HTTPS** with a trusted certificate (Let’s Encrypt).
- Forward `Host`, `X-Forwarded-For`, `X-Forwarded-Proto` so Better Auth and rate-limit IP keys work.
- **Large bodies / range requests** for listening audio under `/files/listening/…` (Range + streaming).
- Do **not** buffer entire audio responses if the proxy has a small buffer limit.

## Caddy (example)

```caddyfile
english.example.com {
  encode gzip
  reverse_proxy web:3000
}
```

Caddy handles HTTPS automatically when DNS points at the host.

## nginx (example)

```nginx
server {
  listen 443 ssl http2;
  server_name english.example.com;

  client_max_body_size 8m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    # Audio / file streaming
    proxy_buffering off;
    proxy_request_buffering off;
  }
}
```

Set `BETTER_AUTH_URL=https://english.example.com` and Google OAuth redirect URIs to match.

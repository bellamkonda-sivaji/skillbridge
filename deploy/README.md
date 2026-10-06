# Deploying JobOn

JobOn runs on the shared mindsyncos server (Hetzner, `49.12.232.156`)
alongside myinflue and tnetwork. Every app there is a service in one
`/opt/mindsync/docker-compose.yml` on the `mindsync-net` network, reached by
container name from a single nginx that owns ports 80 and 443. Nothing
publishes a host port.

| Piece | Where |
|---|---|
| Code | `/opt/mindsync/jobon` (this repo, branch checked out) |
| Backend env | `/opt/mindsync/jobon-config/backend.env` (mode 600, not in git) |
| Services | `jobon-backend`, `jobon-frontend` in `/opt/mindsync/docker-compose.yml` |
| Database | `jobon` in the shared `mindsync-postgres-1` |
| Admin console | https://jobon.mindsyncos.com |
| API | https://jobon-api.mindsyncos.com |

The mobile apps are **not** deployed here. They are Play Store artifacts
built with EAS, and only need the API hostname above.

## Deploying a change

```sh
ssh root@49.12.232.156
cd /opt/mindsync/jobon && git pull
cd /opt/mindsync
docker compose build jobon-backend jobon-frontend
docker compose up -d jobon-backend jobon-frontend
```

The frontend bakes its bundle at build time, so a frontend change needs the
build step, not just a restart.

## First-time setup

1. **DNS** — A records for `jobon` and `jobon-api` pointing at the server.
2. **Database** — create the role and database in the shared Postgres:
   ```sql
   CREATE USER jobon WITH PASSWORD '<generated>';
   CREATE DATABASE jobon OWNER jobon;
   ```
3. **Environment** — write `/opt/mindsync/jobon-config/backend.env`
   (see "Environment" below), `chmod 600`.
4. **nginx** — paste `nginx-jobon.conf` into `/opt/mindsync/nginx.conf`,
   then `nginx -t` before reloading. That file fronts every site on the box.
5. **TLS** — add the new names to the existing certificate:
   ```sh
   certbot certonly --webroot -w /var/www/certbot \
     -d mindsyncos.com -d www.mindsyncos.com -d api.mindsyncos.com \
     -d myinflue.mindsyncos.com -d myinflue-api.mindsyncos.com \
     -d tnetwork.mindsyncos.com -d tnetwork-api.mindsyncos.com \
     -d jobon.mindsyncos.com -d jobon-api.mindsyncos.com
   ```
   It is one multi-SAN certificate shared by every vhost, so the renewal has
   to list all of them or the others lose coverage.

## Environment

| Variable | Why |
|---|---|
| `DB_URL` `DB_DRIVER` `DB_USER` `DB_PASSWORD` | Postgres. Without these the app silently falls back to in-memory H2 and loses everything on restart. |
| `JWT_SECRET` | Signs every token. The default in `application.yml` is public; anyone with the repo could mint an admin token. |
| `H2_CONSOLE` | Must stay `false`. It is an unauthenticated web SQL console over the whole database. |
| `FCM_CREDENTIALS` | Path to the Firebase service account JSON for push. Empty means tokens are stored but nothing is sent. |
| `SKILLBRIDGE_SEED_ENABLED` | Demo data. See below. |

## Seed data

The seeder fills an empty database with demo workers, employers and jobs so
there is something to look at — including a Super Admin on `9000000001`.
**Those passwords are in the repository.** On anything reachable from the
internet, either set `SKILLBRIDGE_SEED_ENABLED=false` and create the first
admin by hand, or change every seeded password immediately. The seeder skips
a database that already has accounts, so it cannot overwrite real data.

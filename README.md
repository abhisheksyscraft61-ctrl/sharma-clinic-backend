# ClinicCare Backend

Node.js + Express + PostgreSQL backend for the ClinicCare Flutter app
(2 clinics, same owner, shared patients, per-visit clinic tagging,
prescription photo/PDF uploads).

**Fully tested end-to-end** — register/login, clinic & doctor CRUD,
patient search, doctor assignment (max 3, enforced at both the API and
database level), visit creation with real multipart file upload, and
streaming the uploaded file back out all work as verified during
development.

## 1. Requirements

- Node.js 18+
- PostgreSQL 14+

## 2. Setup

```bash
cd clinic-backend
npm install

# copy env file and fill in your local Postgres credentials
cp .env.example .env
```

Create the database and load the schema:

```bash
createdb clinic_db
psql -U postgres -d clinic_db -f db/schema.sql

# optional: sample data (2 clinics, 4 doctors, 2 patients, 2 visits)
# login: admin@cliniccare.com / staff@cliniccare.com, password: Password@123
psql -U postgres -d clinic_db -f db/seed.sql
```

Run the server:

```bash
npm run dev     # with nodemon (auto-restart)
npm start       # plain node
```

Server starts at `http://localhost:5000`. Health check: `GET /health`.

## 3. Project Structure

```
src/
  config/db.js          -> PostgreSQL connection pool
  middleware/
    auth.js              -> JWT verification + role guard
    upload.js             -> Multer config (image/pdf only, 10MB limit)
    validate.js           -> express-validator error wrapper
    errorHandler.js        -> central error formatting (404 + 500 etc.)
  repositories/           -> raw SQL, one file per table/entity
  controllers/             -> request handling, calls repositories
  routes/                   -> Express routers, wires validation + auth
  app.js                     -> Express app (middleware + route mounting)
  server.js                   -> entry point, connects DB then listens
db/
  schema.sql                   -> full Postgres schema + triggers
  seed.sql                      -> sample data for local dev
uploads/                          -> uploaded prescription files (gitignored)
```

## 4. Authentication

All routes except `/api/auth/register` and `/api/auth/login` require:

```
Authorization: Bearer <token>
```

Get a token from `/api/auth/login`. Tokens expire per `JWT_EXPIRES_IN`
in `.env` (default 7 days).

Two roles: `admin` (can manage clinics + doctors) and `staff` (can manage
patients/visits). Adjust `requireRole(...)` in the route files if you
want different permission boundaries.

## 5. API Reference

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password, role? }` | role defaults to `staff` |
| POST | `/auth/login` | `{ email, password }` | returns `{ user, token }` |
| GET | `/auth/me` | — | requires token |

### Clinics
| Method | Endpoint | Body |
|---|---|---|
| GET | `/clinics` | — (returns each clinic with `stats.patient_count` / `stats.visit_count`) |
| GET | `/clinics/:id` | — |
| POST | `/clinics` | `{ name, address }` — admin only |
| PUT | `/clinics/:id` | `{ name?, address? }` — admin only |
| DELETE | `/clinics/:id` | — admin only |

### Doctors
| Method | Endpoint | Body |
|---|---|---|
| GET | `/doctors` | — |
| POST | `/doctors` | `{ name, specialization }` |
| PUT | `/doctors/:id` | `{ name?, specialization? }` |
| DELETE | `/doctors/:id` | — |

### Patients
| Method | Endpoint | Body / Query |
|---|---|---|
| GET | `/patients?search=&clinicId=` | search matches name or phone; clinicId filters to patients with a visit at that clinic |
| GET | `/patients/:id` | returns patient + `doctors[]` |
| POST | `/patients` | `{ name, age, sex, phone, address, registrationNo }` |
| PUT | `/patients/:id` | any subset of the same fields |
| DELETE | `/patients/:id` | cascades to visits + files |
| POST | `/patients/:id/doctors` | `{ doctorId }` — max 3 per patient (400 if exceeded) |
| DELETE | `/patients/:id/doctors/:doctorId` | — |

### Visits (nested under patient + standalone)
| Method | Endpoint | Body |
|---|---|---|
| GET | `/patients/:patientId/visits` | — newest first, each with nested `files[]` |
| POST | `/patients/:patientId/visits` | multipart/form-data: `clinicId`, `doctorId`, `visitDate` (YYYY-MM-DD), `notes`, `files` (up to 5, jpg/png/webp/pdf) |
| GET | `/visits/:id` | — |
| DELETE | `/visits/:id` | also deletes attached files from disk |

### Prescription Files
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/visits/files/:fileId/open` | streams the file with the correct `Content-Type` — point an `<Image>` widget or PDF viewer straight at this URL |
| DELETE | `/visits/files/:fileId` | removes the file from disk + DB |

### Example: creating a visit with a file (curl)

```bash
curl -X POST http://localhost:5000/api/patients/<patientId>/visits \
  -H "Authorization: Bearer <token>" \
  -F "clinicId=<clinicId>" \
  -F "doctorId=<doctorId>" \
  -F "visitDate=2026-08-18" \
  -F "notes=Routine checkup" \
  -F "files=@/path/to/prescription.jpg"
```

## 6. Connecting from the Flutter app

- Base URL: point your Dart `http`/`dio` client at `http://<your-server>:5000/api`.
- Store the JWT from `/auth/login` (e.g. `flutter_secure_storage`) and
  attach it as `Authorization: Bearer <token>` on every request.
- For the "Add Visit" screen, use a multipart request (`http.MultipartRequest`
  or `dio.FormData`) matching the fields above; attach files from
  `image_picker` / `file_picker`.
- For the prescription preview screen, load
  `GET /visits/files/:fileId/open` directly into `Image.network(url, headers: {...})`
  for images, or pass that URL to a PDF viewer package for PDFs.

## 7. Production notes

- Switch file storage from local disk to S3 / Supabase Storage / Cloudinary
  for real deployments (multer supports swapping the storage engine).
- Put this behind HTTPS (nginx / a platform like Railway, Render, Fly.io).
- Rotate `JWT_SECRET` and store it in a secrets manager, not `.env`, in prod.
- Add rate limiting (e.g. `express-rate-limit`) on `/auth/login`.
- Consider soft-deletes (a `deleted_at` column) instead of hard `DELETE`
  if you need an audit trail of removed patients/visits.

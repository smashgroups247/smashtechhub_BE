// tests/integration/contact.routes.test.ts
/**
 * Integration tests for Contact routes.
 * Assembles a minimal Express app that wires real validators, controllers,
 * services and repositories against the in-memory Mongo from jest.setup.
 */
import express from "express";
import request from "supertest";
import { contactRouter } from "@/api/v1/routes/contact.routes";
import { ContactModel } from "@/domain/contact/models/contact.model";
import {
  generateAdminToken,
  generateUserToken,
  seedContacts,
  VALID_CONTACT_CREATE,
} from "../setup/test-helpers";

// ── App assembly ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Inline JWT decoder (mirrors the real authenticate middleware)
app.use((req, _res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      const token = header.split(" ")[1];
      const secret = process.env.JWT_SECRET || "test_jwt_secret_for_unit_tests";
      (req as any).user = jwt.verify(token, secret);
    } catch {
      // intentionally empty – downstream middleware handles 401
    }
  }
  next();
});

app.use("/api/v1/contact", contactRouter);

// Generic error → JSON
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
      statusCode: status,
      success: false,
      message: err.message || "Internal Server Error",
    });
  },
);

// ── helpers ───────────────────────────────────────────────────────────────────
const adminH = () => ({ Authorization: `Bearer ${generateAdminToken()}` });
const userH = () => ({ Authorization: `Bearer ${generateUserToken()}` });

// ── POST /api/v1/contact ──────────────────────────────────────────────────────
describe("POST /api/v1/contact", () => {
  it("returns 201 and persists the submission", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .send(VALID_CONTACT_CREATE);

    expect(res.status).toBe(201);
    expect(res.body.data.fullName).toBe("Jane Smith");
    expect(res.body.data.status).toBe("new");

    const inDB = await ContactModel.findById(res.body.data._id);
    expect(inDB?.email).toBe("jane@example.com");
  });

  it("returns 400 on missing required field", async () => {
    const { projectDetails: _, ...incomplete } = VALID_CONTACT_CREATE;
    const res = await request(app).post("/api/v1/contact").send(incomplete);
    expect(res.status).toBe(400);
  });

  it("returns 429 when same email submits twice within 60 min", async () => {
    // First submission succeeds
    await request(app).post("/api/v1/contact").send(VALID_CONTACT_CREATE);

    // Second submission from same email → rate limited by service
    const res = await request(app)
      .post("/api/v1/contact")
      .send(VALID_CONTACT_CREATE);
    expect(res.status).toBe(429);
  });

  it("returns 400 when projectDetails < 10 chars", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, projectDetails: "short" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when serviceOfInterest is not in allowed list", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .send({
        ...VALID_CONTACT_CREATE,
        email: "test-invalid-service@example.com",
        serviceOfInterest: "Hacking",
      });

    expect(res.status).toBe(400);
  });
});

// ── GET /api/v1/contact  (admin list) ────────────────────────────────────────
describe("GET /api/v1/contact", () => {
  beforeEach(async () => {
    await seedContacts(6);
  });

  it("returns 200 with paginated list for admin", async () => {
    const res = await request(app)
      .get("/api/v1/contact?page=1&limit=3")
      .set(adminH());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(6);
  });

  it("filters by status=new", async () => {
    const res = await request(app)
      .get("/api/v1/contact?status=new")
      .set(adminH());

    expect(res.status).toBe(200);
    // seedContacts: index 0 is 'new'
    res.body.data.forEach((item: any) => expect(item.status).toBe("new"));
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/contact");
    expect(res.status).toBe(401);
  });

  it("returns 403 with a non-admin token", async () => {
    const res = await request(app).get("/api/v1/contact").set(userH());
    expect(res.status).toBe(403);
  });
});

// ── GET /api/v1/contact/:id ───────────────────────────────────────────────────
describe("GET /api/v1/contact/:id", () => {
  it("returns 200 with the submission", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .get(`/api/v1/contact/${doc._id}`)
      .set(adminH());

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Jane Smith");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app)
      .get("/api/v1/contact/000000000000000000000000")
      .set(adminH());

    expect(res.status).toBe(404);
  });

  it("returns 400 for malformed id", async () => {
    const res = await request(app).get("/api/v1/contact/bad-id").set(adminH());

    expect(res.status).toBe(400);
  });
});

// ── GET /api/v1/contact/stats ─────────────────────────────────────────────────
describe("GET /api/v1/contact/stats", () => {
  it("returns correct counts after seeding", async () => {
    // seed: 1 new, 1 in-progress, 1 resolved
    await seedContacts(3);

    const res = await request(app).get("/api/v1/contact/stats").set(adminH());

    expect(res.status).toBe(200);
    expect(res.body.data.new).toBe(1);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.resolved).toBe(1);
    expect(res.body.data.total).toBe(3);
  });
});

// ── PATCH /api/v1/contact/:id/status ──────────────────────────────────────────
describe("PATCH /api/v1/contact/:id/status", () => {
  it("transitions status to in-progress and persists adminNotes", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}/status`)
      .set(adminH())
      .send({ status: "in-progress", adminNotes: "Working on it." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in-progress");
    expect(res.body.data.adminNotes).toBe("Working on it.");
  });

  it("sets resolvedAt when status → resolved", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "in-progress",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}/status`)
      .set(adminH())
      .send({ status: "resolved" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("resolved");
    expect(res.body.data.resolvedAt).toBeDefined();
  });

  it("returns 400 when status field is missing", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}/status`)
      .set(adminH())
      .send({ adminNotes: "oops no status" });

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent contact", async () => {
    const res = await request(app)
      .patch("/api/v1/contact/000000000000000000000000/status")
      .set(adminH())
      .send({ status: "resolved" });

    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/v1/contact/:id  (general partial update) ──────────────────────
describe("PATCH /api/v1/contact/:id", () => {
  it("updates only fullName, leaves other fields unchanged", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}`)
      .set(adminH())
      .send({ fullName: "Patched Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Patched Name");
    // original fields untouched
    expect(res.body.data.email).toBe("jane@example.com");
    expect(res.body.data.status).toBe("new");
  });

  it("updates multiple fields in one call", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}`)
      .set(adminH())
      .send({
        fullName: "Multi",
        adminNotes: "Note added",
        status: "in-progress",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Multi");
    expect(res.body.data.adminNotes).toBe("Note added");
    expect(res.body.data.status).toBe("in-progress");
  });

  it("returns 400 when body is empty", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}`)
      .set(adminH())
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid serviceOfInterest", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}`)
      .set(adminH())
      .send({ serviceOfInterest: "Not A Real Service" });

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent contact", async () => {
    const res = await request(app)
      .patch("/api/v1/contact/000000000000000000000000")
      .set(adminH())
      .send({ fullName: "Ghost" });

    expect(res.status).toBe(404);
  });

  it("returns 403 with non-admin token", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app)
      .patch(`/api/v1/contact/${doc._id}`)
      .set(userH())
      .send({ fullName: "Hacker" });

    expect(res.status).toBe(403);
  });
});

// ── DELETE /api/v1/contact/:id ────────────────────────────────────────────────
describe("DELETE /api/v1/contact/:id", () => {
  it("soft-deletes: sets deletedAt and doc disappears from GET", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const delRes = await request(app)
      .delete(`/api/v1/contact/${doc._id}`)
      .set(adminH());

    expect(delRes.status).toBe(200);

    // GET should 404
    const getRes = await request(app)
      .get(`/api/v1/contact/${doc._id}`)
      .set(adminH());
    expect(getRes.status).toBe(404);

    // Raw doc still has deletedAt
    const raw = await ContactModel.findById(doc._id);
    expect(raw?.deletedAt).not.toBeNull();
  });

  it("returns 404 for already soft-deleted contact", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
      deletedAt: new Date(),
    });

    const res = await request(app)
      .delete(`/api/v1/contact/${doc._id}`)
      .set(adminH());

    expect(res.status).toBe(404);
  });

  it("returns 401 without token", async () => {
    const doc = await ContactModel.create({
      ...VALID_CONTACT_CREATE,
      status: "new",
    });

    const res = await request(app).delete(`/api/v1/contact/${doc._id}`);
    expect(res.status).toBe(401);
  });
});

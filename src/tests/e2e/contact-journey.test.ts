// tests/e2e/contact-journey.test.ts
/**
 * End-to-end journey tests for the Contact module.
 *
 * Journey 1 – Public user submits, admin reviews & resolves.
 * Journey 2 – Rate-limit enforcement across two submissions.
 * Journey 3 – Stats counter stays accurate through the lifecycle.
 *
 * Tests within each describe are ORDERED; every step depends on the
 * previous one.  Shared state lives in describe-scoped variables.
 */
import express from "express";
import request from "supertest";
import { contactRouter } from "@/api/v1/routes/contact.routes";
import { ContactModel } from "@/domain/contact/models/contact.model";
import {
  generateAdminToken,
  VALID_CONTACT_CREATE,
} from "../setup/test-helpers";

// ── Minimal app (same pattern used by integration tests) ────────────────────
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const h = req.headers.authorization;
  if (h && h.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      (req as any).user = jwt.verify(
        h.split(" ")[1],
        process.env.JWT_SECRET || "test_jwt_secret_for_unit_tests",
      );
    } catch {
      /* noop */
    }
  }
  next();
});
app.use("/api/v1/contact", contactRouter);
app.use(
  (
    err: any,
    _r: express.Request,
    res: express.Response,
    _n: express.NextFunction,
  ) => {
    res.status(err.statusCode || 500).json({
      statusCode: err.statusCode || 500,
      success: false,
      message: err.message,
    });
  },
);

const admin = () => ({ Authorization: `Bearer ${generateAdminToken()}` });

// ── Journey 1: public submit → admin triage → resolve ───────────────────────
describe("E2E Contact – Public submit → admin triage → resolve", () => {
  let contactId: string;

  test("1. Public user submits a contact form (no auth needed)", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .send(VALID_CONTACT_CREATE);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("new");
    contactId = res.body.data._id;
    expect(contactId).toBeDefined();
  });

  test('2. Submission appears in admin list with status "new"', async () => {
    const res = await request(app)
      .get("/api/v1/contact?status=new")
      .set(admin());

    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c._id === contactId)).toBe(true);
  });

  test("3. Admin fetches the single submission by ID", async () => {
    const res = await request(app)
      .get(`/api/v1/contact/${contactId}`)
      .set(admin());

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Jane Smith");
    expect(res.body.data.email).toBe("jane@example.com");
  });

  test('4. Admin moves status to "in-progress" via the status sub-route', async () => {
    const res = await request(app)
      .patch(`/api/v1/contact/${contactId}/status`)
      .set(admin())
      .send({ status: "in-progress", adminNotes: "Assigned to dev team." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in-progress");
    expect(res.body.data.adminNotes).toBe("Assigned to dev team.");
  });

  test("5. General PATCH corrects the fullName mid-triage", async () => {
    const res = await request(app)
      .patch(`/api/v1/contact/${contactId}`)
      .set(admin())
      .send({ fullName: "Jane Smith-Corrected" });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe("Jane Smith-Corrected");
    // other fields unchanged
    expect(res.body.data.status).toBe("in-progress");
    expect(res.body.data.email).toBe("jane@example.com");
  });

  test("6. Admin resolves via the status sub-route; resolvedAt is stamped", async () => {
    const res = await request(app)
      .patch(`/api/v1/contact/${contactId}/status`)
      .set(admin())
      .send({ status: "resolved", adminNotes: "Done." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("resolved");
    expect(res.body.data.resolvedAt).toBeDefined();
    expect(res.body.data.adminNotes).toBe("Done.");
  });

  test("7. Resolved submission no longer shows up in status=new filter", async () => {
    const res = await request(app)
      .get("/api/v1/contact?status=new")
      .set(admin());

    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c._id === contactId)).toBe(false);
  });

  test("8. Admin soft-deletes the submission", async () => {
    const res = await request(app)
      .delete(`/api/v1/contact/${contactId}`)
      .set(admin());

    expect(res.status).toBe(200);
  });

  test("9. GET by ID returns 404 after soft-delete", async () => {
    const res = await request(app)
      .get(`/api/v1/contact/${contactId}`)
      .set(admin());

    expect(res.status).toBe(404);
  });

  test("10. Raw doc still exists in collection with deletedAt populated", async () => {
    const raw = await ContactModel.findById(contactId);
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });
});

// ── Journey 2: rate-limit enforcement ────────────────────────────────────────
describe("E2E Contact – Rate-limit enforcement", () => {
  test("First submission from a fresh email succeeds", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "ratelimit@example.com" });

    expect(res.status).toBe(201);
  });

  test("Second submission from the same email within 60 min → 429", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "ratelimit@example.com" });

    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/already submitted/i);
  });

  test("A different email is not blocked", async () => {
    const res = await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "different@example.com" });

    expect(res.status).toBe(201);
  });
});

// ── Journey 3: stats counter accuracy ─────────────────────────────────────────
describe("E2E Contact – Stats counter stays accurate", () => {
  test("Stats shows 0 across the board on a clean slate", async () => {
    const res = await request(app).get("/api/v1/contact/stats").set(admin());

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      new: 0,
      inProgress: 0,
      resolved: 0,
      total: 0,
    });
  });

  test("After one submission stats.new === 1", async () => {
    await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "stats1@example.com" });

    const res = await request(app).get("/api/v1/contact/stats").set(admin());
    expect(res.body.data.new).toBe(1);
    expect(res.body.data.total).toBe(1);
  });

  test("After moving to in-progress, stats update accordingly", async () => {
    // grab the id we just created
    const list = await request(app).get("/api/v1/contact").set(admin());
    const id = list.body.data[0]._id;

    await request(app)
      .patch(`/api/v1/contact/${id}/status`)
      .set(admin())
      .send({ status: "in-progress" });

    const res = await request(app).get("/api/v1/contact/stats").set(admin());
    expect(res.body.data.new).toBe(0);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.total).toBe(1);
  });

  test("Soft-delete drops total but does not break other buckets", async () => {
    const list = await request(app).get("/api/v1/contact").set(admin());
    const id = list.body.data[0]._id;

    await request(app).delete(`/api/v1/contact/${id}`).set(admin());

    const res = await request(app).get("/api/v1/contact/stats").set(admin());
    expect(res.body.data.total).toBe(0);
  });
});

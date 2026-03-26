// tests/e2e/contact-journey.test.ts
/**
 * End-to-end journey tests for the Contact module.
 *
 * IMPORTANT: E2E tests are CONSOLIDATED into single test blocks to avoid
 * data loss from beforeEach cleanup. Each journey is a single test that
 * performs multiple sequential steps.
 */
import express from "express";
import request from "supertest";
import { contactRouter } from "@/api/v1/routes/contact.routes";
import { ContactModel } from "@/tests/setup/models";
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

// ── Journey 1: public submit → admin triage → resolve (CONSOLIDATED) ────────
describe("E2E Contact – Public submit → admin triage → resolve", () => {
  test("Complete journey: submit → list → fetch → status change → patch → resolve → delete", async () => {
    // Step 1: Public user submits a contact form (no auth needed)
    const submitRes = await request(app)
      .post("/api/v1/contact")
      .send(VALID_CONTACT_CREATE);

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.data.status).toBe("new");
    const contactId = submitRes.body.data.id;
    expect(contactId).toBeDefined();

    // Step 2: Submission appears in admin list with status "new"
    const listRes = await request(app)
      .get("/api/v1/contact?status=new")
      .set(admin());

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((c: any) => c.id === contactId)).toBe(true);

    // Step 3: Admin fetches the single submission by ID
    const fetchRes = await request(app)
      .get(`/api/v1/contact/${contactId}`)
      .set(admin());

    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.fullName).toBe("Jane Smith");
    expect(fetchRes.body.data.email).toBe("jane@example.com");

    // Step 4: Admin moves status to "in-progress" via the status sub-route
    const statusRes = await request(app)
      .patch(`/api/v1/contact/${contactId}/status`)
      .set(admin())
      .send({ status: "in-progress", adminNotes: "Assigned to dev team." });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe("in-progress");
    expect(statusRes.body.data.adminNotes).toBe("Assigned to dev team.");

    // Step 5: General PATCH corrects the fullName mid-triage
    const patchRes = await request(app)
      .patch(`/api/v1/contact/${contactId}`)
      .set(admin())
      .send({ fullName: "Jane Smith-Corrected" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.fullName).toBe("Jane Smith-Corrected");
    expect(patchRes.body.data.status).toBe("in-progress");
    expect(patchRes.body.data.email).toBe("jane@example.com");

    // Step 6: Admin resolves via the status sub-route; resolvedAt is stamped
    const resolveRes = await request(app)
      .patch(`/api/v1/contact/${contactId}/status`)
      .set(admin())
      .send({ status: "resolved", adminNotes: "Done." });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe("resolved");
    expect(resolveRes.body.data.resolvedAt).toBeDefined();
    expect(resolveRes.body.data.adminNotes).toBe("Done.");

    // Step 7: Resolved submission no longer shows up in status=new filter
    const filterRes = await request(app)
      .get("/api/v1/contact?status=new")
      .set(admin());

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.some((c: any) => c.id === contactId)).toBe(false);

    // Step 8: Admin soft-deletes the submission
    const deleteRes = await request(app)
      .delete(`/api/v1/contact/${contactId}`)
      .set(admin());

    expect(deleteRes.status).toBe(200);

    // Step 9: GET by ID returns 404 after soft-delete
    const deleted404Res = await request(app)
      .get(`/api/v1/contact/${contactId}`)
      .set(admin());

    expect(deleted404Res.status).toBe(404);

    // Step 10: Raw doc still exists in collection with deletedAt populated
    const raw = await ContactModel.findById(contactId);
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });
});

// ── Journey 2: rate-limit enforcement (CONSOLIDATED) ─────────────────────────
describe("E2E Contact – Rate-limit enforcement", () => {
  test("Rate limit: first succeeds, second from same email gets 429, different email succeeds", async () => {
    // Step 1: First submission from a fresh email succeeds
    const first = await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "ratelimit@example.com" });

    expect(first.status).toBe(201);

    // Step 2: Second submission from the same email within 60 min → 429
    const second = await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "ratelimit@example.com" });

    expect(second.status).toBe(429);
    expect(second.body.message).toMatch(/already submitted/i);

    // Step 3: A different email is not blocked
    const different = await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "different@example.com" });

    expect(different.status).toBe(201);
  });
});

// ── Journey 3: stats counter accuracy (CONSOLIDATED) ─────────────────────────
describe("E2E Contact – Stats counter stays accurate", () => {
  test("Stats lifecycle: zero → new → in-progress → deleted", async () => {
    // Step 1: Stats shows 0 across the board on a clean slate
    const stats0 = await request(app).get("/api/v1/contact/stats").set(admin());
    expect(stats0.status).toBe(200);
    expect(stats0.body.data).toEqual({
      new: 0,
      inProgress: 0,
      resolved: 0,
      total: 0,
    });

    // Step 2: After one submission stats.new === 1
    await request(app)
      .post("/api/v1/contact")
      .send({ ...VALID_CONTACT_CREATE, email: "stats1@example.com" });

    const stats1 = await request(app).get("/api/v1/contact/stats").set(admin());
    expect(stats1.body.data.new).toBe(1);
    expect(stats1.body.data.total).toBe(1);

    // Step 3: After moving to in-progress, stats update accordingly
    const list = await request(app).get("/api/v1/contact").set(admin());
    const id = list.body.data[0].id;

    await request(app)
      .patch(`/api/v1/contact/${id}/status`)
      .set(admin())
      .send({ status: "in-progress" });

    const stats2 = await request(app).get("/api/v1/contact/stats").set(admin());
    expect(stats2.body.data.new).toBe(0);
    expect(stats2.body.data.inProgress).toBe(1);
    expect(stats2.body.data.total).toBe(1);

    // Step 4: Soft-delete drops total but does not break other buckets
    await request(app).delete(`/api/v1/contact/${id}`).set(admin());

    const stats3 = await request(app).get("/api/v1/contact/stats").set(admin());
    expect(stats3.body.data.total).toBe(0);
  });
});
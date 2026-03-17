// tests/e2e/pricing-journey.test.ts
/**
 * End-to-end journey tests for the Pricing module.
 *
 * IMPORTANT: E2E tests are CONSOLIDATED into single test blocks to avoid
 * data loss from beforeEach cleanup. Each journey is a single test that
 * performs multiple sequential steps.
 */
import express from "express";
import request from "supertest";
import { pricingRouter } from "@/api/v1/routes/pricing.routes";
import { PricingModel } from "@/domain/pricing/models/pricing.model";
import {
  generateAdminToken,
  VALID_PRICING_CREATE,
  VALID_PRICING_PUT,
} from "../setup/test-helpers";

// ── App (identical to integration helper) ────────────────────────────────────
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      (req as any).user = jwt.verify(
        header.split(" ")[1],
        process.env.JWT_SECRET || "test_jwt_secret_for_unit_tests",
      );
    } catch {
      /* noop */
    }
  }
  next();
});
app.use("/api/v1/pricing", pricingRouter);
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(err.statusCode || 500).json({
      statusCode: err.statusCode || 500,
      success: false,
      message: err.message,
    });
  },
);

const auth = () => ({ Authorization: `Bearer ${generateAdminToken()}` });

// ── Journey 1: Full admin lifecycle (CONSOLIDATED) ──────────────────────────
describe("E2E Pricing – Full admin lifecycle", () => {
  test("Complete lifecycle: create → list → fetch → patch → put → toggle → delete", async () => {
    // Step 1: Admin creates a new plan
    const createRes = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send(VALID_PRICING_CREATE);

    expect(createRes.status).toBe(201);
    const planId = createRes.body.data._id;
    expect(planId).toBeDefined();

    // Step 2: Plan appears in the paginated list
    const listRes = await request(app).get("/api/v1/pricing");
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((p: any) => p._id === planId)).toBe(true);

    // Step 3: Plan is fetchable by ID
    const fetchRes = await request(app).get(`/api/v1/pricing/${planId}`);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.name).toBe("Starter Plan");
    expect(fetchRes.body.data.price).toBe(15000);

    // Step 4: PATCH updates only price – name stays the same
    const patchRes = await request(app)
      .patch(`/api/v1/pricing/${planId}`)
      .set(auth())
      .send({ price: 22000 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.price).toBe(22000);
    expect(patchRes.body.data.name).toBe("Starter Plan"); // unchanged

    // Step 5: PUT fully replaces the plan – all fields change
    const putRes = await request(app)
      .put(`/api/v1/pricing/${planId}`)
      .set(auth())
      .send(VALID_PRICING_PUT);

    expect(putRes.status).toBe(200);
    expect(putRes.body.data.name).toBe("Starter Plan Updated");
    expect(putRes.body.data.currency).toBe("USD");
    expect(putRes.body.data.billingCycle).toBe("yearly");

    // Step 6: Toggle-status flips isActive to false
    const toggle1Res = await request(app)
      .patch(`/api/v1/pricing/${planId}/toggle-status`)
      .set(auth());

    expect(toggle1Res.status).toBe(200);
    expect(toggle1Res.body.data.isActive).toBe(false);

    // Step 7: Plan no longer appears in /active
    const activeRes = await request(app).get("/api/v1/pricing/active");
    expect(activeRes.status).toBe(200);
    expect(activeRes.body.data.some((p: any) => p._id === planId)).toBe(false);

    // Step 8: Toggle-status flips isActive back to true
    const toggle2Res = await request(app)
      .patch(`/api/v1/pricing/${planId}/toggle-status`)
      .set(auth());

    expect(toggle2Res.status).toBe(200);
    expect(toggle2Res.body.data.isActive).toBe(true);

    // Step 9: DELETE soft-deletes the plan
    const deleteRes = await request(app)
      .delete(`/api/v1/pricing/${planId}`)
      .set(auth());

    expect(deleteRes.status).toBe(200);

    // Step 10: GET by ID returns 404 after soft-delete
    const deleted404Res = await request(app).get(`/api/v1/pricing/${planId}`);
    expect(deleted404Res.status).toBe(404);

    // Step 11: Raw document still exists with deletedAt set
    const raw = await PricingModel.findById(planId);
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });
});

// ── Journey 2: Duplicate-name guard (CONSOLIDATED) ───────────────────────────
describe("E2E Pricing – Duplicate name prevention", () => {
  test("Duplicate name scenarios: create collision, patch collision, self-patch allowed", async () => {
    // Step 1: Create "Unique Plan"
    const res1 = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send({ ...VALID_PRICING_CREATE, name: "Unique Plan" });

    expect(res1.status).toBe(201);
    const firstId = res1.body.data._id;

    // Step 2: Create another plan with same name → 400
    const res2 = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send({ ...VALID_PRICING_CREATE, name: "Unique Plan" });

    expect(res2.status).toBe(400);

    // Step 3: Create "Other Plan" then PATCH its name to "Unique Plan" → 400
    const createOther = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send({ ...VALID_PRICING_CREATE, name: "Other Plan" });

    expect(createOther.status).toBe(201);

    const patchCollision = await request(app)
      .patch(`/api/v1/pricing/${createOther.body.data._id}`)
      .set(auth())
      .send({ name: "Unique Plan" });

    expect(patchCollision.status).toBe(400);

    // Step 4: PATCH "Unique Plan" to its own name (no-op) → 200
    const selfPatch = await request(app)
      .patch(`/api/v1/pricing/${firstId}`)
      .set(auth())
      .send({ name: "Unique Plan", price: 1 });

    expect(selfPatch.status).toBe(200);
  });
});
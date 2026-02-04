// tests/e2e/pricing-journey.test.ts
/**
 * End-to-end journey tests for the Pricing module.
 *
 * Each describe block walks through a realistic user scenario from start
 * to finish, hitting the real DB through the real route stack.
 *
 * Ordering within a describe MATTERS — each test builds on the state
 * left by the previous one.  We use `let` variables at the describe scope
 * to carry IDs / state across tests.
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

// ── Journey 1: Full admin lifecycle ──────────────────────────────────────────
describe("E2E Pricing – Full admin lifecycle", () => {
  let planId: string;

  test("1. Admin creates a new plan", async () => {
    const res = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send(VALID_PRICING_CREATE);

    expect(res.status).toBe(201);
    planId = res.body.data._id;
    expect(planId).toBeDefined();
  });

  test("2. Plan appears in the paginated list", async () => {
    const res = await request(app).get("/api/v1/pricing");

    expect(res.status).toBe(200);
    expect(res.body.data.some((p: any) => p._id === planId)).toBe(true);
  });

  test("3. Plan is fetchable by ID", async () => {
    const res = await request(app).get(`/api/v1/pricing/${planId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Starter Plan");
    expect(res.body.data.price).toBe(15000);
  });

  test("4. PATCH updates only price – name stays the same", async () => {
    const res = await request(app)
      .patch(`/api/v1/pricing/${planId}`)
      .set(auth())
      .send({ price: 22000 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(22000);
    expect(res.body.data.name).toBe("Starter Plan"); // unchanged
  });

  test("5. PUT fully replaces the plan – all fields change", async () => {
    const res = await request(app)
      .put(`/api/v1/pricing/${planId}`)
      .set(auth())
      .send(VALID_PRICING_PUT);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Starter Plan Updated");
    expect(res.body.data.currency).toBe("USD");
    expect(res.body.data.billingCycle).toBe("yearly");
  });

  test("6. Toggle-status flips isActive to false", async () => {
    const res = await request(app)
      .patch(`/api/v1/pricing/${planId}/toggle-status`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  test("7. Plan no longer appears in /active", async () => {
    const res = await request(app).get("/api/v1/pricing/active");

    expect(res.status).toBe(200);
    expect(res.body.data.some((p: any) => p._id === planId)).toBe(false);
  });

  test("8. Toggle-status flips isActive back to true", async () => {
    const res = await request(app)
      .patch(`/api/v1/pricing/${planId}/toggle-status`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });

  test("9. DELETE soft-deletes the plan", async () => {
    const res = await request(app)
      .delete(`/api/v1/pricing/${planId}`)
      .set(auth());

    expect(res.status).toBe(200);
  });

  test("10. GET by ID returns 404 after soft-delete", async () => {
    const res = await request(app).get(`/api/v1/pricing/${planId}`);
    expect(res.status).toBe(404);
  });

  test("11. Raw document still exists with deletedAt set", async () => {
    const raw = await PricingModel.findById(planId);
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
  });
});

// ── Journey 2: Duplicate-name guard across create & patch ───────────────────
describe("E2E Pricing – Duplicate name prevention", () => {
  let firstId: string;

  test('1. Create "Unique Plan"', async () => {
    const res = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send({ ...VALID_PRICING_CREATE, name: "Unique Plan" });

    expect(res.status).toBe(201);
    firstId = res.body.data._id;
  });

  test("2. Create another plan with same name → 400", async () => {
    const res = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send({ ...VALID_PRICING_CREATE, name: "Unique Plan" });

    expect(res.status).toBe(400);
  });

  test('3. Create "Other Plan" then PATCH its name to "Unique Plan" → 400', async () => {
    const createRes = await request(app)
      .post("/api/v1/pricing")
      .set(auth())
      .send({ ...VALID_PRICING_CREATE, name: "Other Plan" });

    expect(createRes.status).toBe(201);

    const patchRes = await request(app)
      .patch(`/api/v1/pricing/${createRes.body.data._id}`)
      .set(auth())
      .send({ name: "Unique Plan" });

    expect(patchRes.status).toBe(400);
  });

  test('4. PATCH "Unique Plan" to its own name (no-op) → 200', async () => {
    const res = await request(app)
      .patch(`/api/v1/pricing/${firstId}`)
      .set(auth())
      .send({ name: "Unique Plan", price: 1 });

    expect(res.status).toBe(200);
  });
});

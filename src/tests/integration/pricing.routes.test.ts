// tests/integration/pricing.routes.test.ts
/**
 * Integration tests — real Mongoose models against MongoMemoryServer (via jest.setup).
 * A minimal Express app is assembled here so we test the full
 * controller → service → repository → MongoDB stack in one shot.
 */
import express from "express";
import request from "supertest";
import { pricingRouter } from "@/api/v1/routes/pricing.routes";
import { PricingModel } from "@/tests/setup/models";
import {
  generateAdminToken,
  generateUserToken,
  seedPricingPlans,
  VALID_PRICING_CREATE,
  VALID_PRICING_PUT,
} from "../setup/test-helpers";

// ── Minimal app wiring (mirrors server.ts but stripped to essentials) ─────────
// We stub authenticate + isAdmin inline so the test controls auth completely.
const app = express();
app.use(express.json());

// Inline auth middleware that trusts our test tokens
app.use((req, _res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const jwt = require("jsonwebtoken");
      const token = header.split(" ")[1];
      const secret = process.env.JWT_SECRET || "test_jwt_secret_for_unit_tests";
      (req as any).user = jwt.verify(token, secret);
    } catch {
      // leave req.user undefined — downstream middleware handles 401
    }
  }
  next();
});

app.use("/api/v1/pricing", pricingRouter);

// Generic error handler so AppError surfaces as JSON
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
const adminHeaders = () => ({
  Authorization: `Bearer ${generateAdminToken()}`,
});
const userHeaders = () => ({ Authorization: `Bearer ${generateUserToken()}` });

// ── POST /api/v1/pricing ──────────────────────────────────────────────────────
describe("POST /api/v1/pricing", () => {
  it("returns 201 and persists a new plan", async () => {
    const res = await request(app)
      .post("/api/v1/pricing")
      .set(adminHeaders())
      .send(VALID_PRICING_CREATE);

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Starter Plan");
    expect(res.body.data.id).toBeDefined();

    // verify in DB
    const inDB = await PricingModel.findById(res.body.data.id);
    expect(inDB?.name).toBe("Starter Plan");
  });

  it("returns 400 on validation error (missing features)", async () => {
    const { features: _, ...noFeatures } = VALID_PRICING_CREATE;
    const res = await request(app)
      .post("/api/v1/pricing")
      .set(adminHeaders())
      .send(noFeatures);

    expect(res.status).toBe(400);
  });

  it("returns 400 when name already exists", async () => {
    await PricingModel.create(VALID_PRICING_CREATE);

    const res = await request(app)
      .post("/api/v1/pricing")
      .set(adminHeaders())
      .send(VALID_PRICING_CREATE);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/api/v1/pricing")
      .send(VALID_PRICING_CREATE);
    expect(res.status).toBe(401);
  });

  it("returns 403 with a non-admin token", async () => {
    const res = await request(app)
      .post("/api/v1/pricing")
      .set(userHeaders())
      .send(VALID_PRICING_CREATE);

    expect(res.status).toBe(403);
  });
});

// ── GET /api/v1/pricing ───────────────────────────────────────────────────────
describe("GET /api/v1/pricing", () => {
  beforeEach(async () => {
    await seedPricingPlans(5);
  });

  it("returns 200 with paginated data", async () => {
    const res = await request(app).get("/api/v1/pricing?page=1&limit=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.totalPages).toBe(3);
  });

  it("filters by isActive=true", async () => {
    const res = await request(app).get("/api/v1/pricing?isActive=true");

    expect(res.status).toBe(200);
    // seedPricingPlans makes last one inactive → 4 active
    expect(res.body.data).toHaveLength(4);
  });

  it("filters by isActive=false", async () => {
    const res = await request(app).get("/api/v1/pricing?isActive=false");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

// ── GET /api/v1/pricing/active ────────────────────────────────────────────────
describe("GET /api/v1/pricing/active", () => {
  it("returns only active plans without pagination wrapper", async () => {
    await seedPricingPlans(4); // 3 active, 1 inactive

    const res = await request(app).get("/api/v1/pricing/active");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });
});

// ── GET /api/v1/pricing/:id ───────────────────────────────────────────────────
describe("GET /api/v1/pricing/:id", () => {
  it("returns 200 with the plan", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);

    const res = await request(app).get(`/api/v1/pricing/${plan.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Starter Plan");
  });

  it("returns 404 for non-existent id", async () => {
    const res = await request(app).get(
      "/api/v1/pricing/000000000000000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for malformed id", async () => {
    const res = await request(app).get("/api/v1/pricing/not-a-valid-id");
    expect(res.status).toBe(400);
  });
});

// ── PUT /api/v1/pricing/:id ───────────────────────────────────────────────────
describe("PUT /api/v1/pricing/:id", () => {
  it("returns 200 and fully replaces the plan", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);

    const res = await request(app)
      .put(`/api/v1/pricing/${plan.id}`)
      .set(adminHeaders())
      .send(VALID_PRICING_PUT);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Starter Plan Updated");
    expect(res.body.data.currency).toBe("USD");
  });

  it("returns 400 when required fields are missing (PUT semantics)", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);

    // Send only price — PUT must reject because name, features, etc. are missing
    const res = await request(app)
      .put(`/api/v1/pricing/${plan.id}`)
      .set(adminHeaders())
      .send({ price: 5000 });

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent plan", async () => {
    const res = await request(app)
      .put("/api/v1/pricing/000000000000000000000000")
      .set(adminHeaders())
      .send(VALID_PRICING_PUT);

    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/v1/pricing/:id ─────────────────────────────────────────────────
describe("PATCH /api/v1/pricing/:id", () => {
  it("returns 200 and updates only the sent field (price)", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);
    const originalName = plan.name;

    const res = await request(app)
      .patch(`/api/v1/pricing/${plan.id}`)
      .set(adminHeaders())
      .send({ price: 77777 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(77777);
    // name must be untouched
    expect(res.body.data.name).toBe(originalName);
  });

  it("returns 200 and updates multiple fields at once", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);

    const res = await request(app)
      .patch(`/api/v1/pricing/${plan.id}`)
      .set(adminHeaders())
      .send({ price: 55000, description: "New desc", displayOrder: 9 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(55000);
    expect(res.body.data.description).toBe("New desc");
    expect(res.body.data.displayOrder).toBe(9);
  });

  it("returns 400 when body is empty (PATCH requires ≥ 1 field)", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);

    const res = await request(app)
      .patch(`/api/v1/pricing/${plan.id}`)
      .set(adminHeaders())
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent plan", async () => {
    const res = await request(app)
      .patch("/api/v1/pricing/000000000000000000000000")
      .set(adminHeaders())
      .send({ price: 100 });

    expect(res.status).toBe(404);
  });

  it("returns 403 with non-admin token", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);

    const res = await request(app)
      .patch(`/api/v1/pricing/${plan.id}`)
      .set(userHeaders())
      .send({ price: 100 });

    expect(res.status).toBe(403);
  });
});

// ── PATCH /api/v1/pricing/:id/toggle-status ──────────────────────────────────
describe("PATCH /api/v1/pricing/:id/toggle-status", () => {
  it("flips isActive from true to false", async () => {
    const plan = await PricingModel.create({
      ...VALID_PRICING_CREATE,
      isActive: true,
    });

    const res = await request(app)
      .patch(`/api/v1/pricing/${plan.id}/toggle-status`)
      .set(adminHeaders());

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it("flips isActive from false to true", async () => {
    const plan = await PricingModel.create({
      ...VALID_PRICING_CREATE,
      isActive: false,
    });

    const res = await request(app)
      .patch(`/api/v1/pricing/${plan.id}/toggle-status`)
      .set(adminHeaders());

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });
});

// ── DELETE /api/v1/pricing/:id ────────────────────────────────────────────────
describe("DELETE /api/v1/pricing/:id", () => {
  it("soft-deletes: sets deletedAt and plan disappears from GET", async () => {
    const plan = await PricingModel.create(VALID_PRICING_CREATE);

    const delRes = await request(app)
      .delete(`/api/v1/pricing/${plan.id}`)
      .set(adminHeaders());

    expect(delRes.status).toBe(200);

    // GET by id should now 404
    const getRes = await request(app).get(`/api/v1/pricing/${plan.id}`);
    expect(getRes.status).toBe(404);

    // But the doc still exists in the raw collection with deletedAt set
    const raw = await PricingModel.findById(plan.id);
    expect(raw?.deletedAt).not.toBeNull();
  });

  it("returns 404 for already-deleted plan", async () => {
    const plan = await PricingModel.create({
      ...VALID_PRICING_CREATE,
      deletedAt: new Date(),
    });

    const res = await request(app)
      .delete(`/api/v1/pricing/${plan.id}`)
      .set(adminHeaders());

    expect(res.status).toBe(404);
  });
});

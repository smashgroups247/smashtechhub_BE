// tests/unit/pricing.service.test.ts
/**
 * Unit tests for pricingService.
 * The real repository is fully mocked so these run without MongoDB.
 */

jest.mock("@/domain/pricing/repositories/pricing.repository");

import { pricingService } from "@/domain/pricing/services/pricing.service";
import { pricingRepository } from "@/domain/pricing/repositories/pricing.repository";
import { AppError } from "@/shared/errors/AppError";
import { VALID_PRICING_CREATE, VALID_PRICING_PUT } from "../setup/test-helpers";

// Helper: a minimal "Mongoose doc" stub that implements toJSON
const mockDoc = (overrides: Record<string, any> = {}) => ({
  _id: "507f1f77bcf86cd799439011",
  name: "Starter Plan",
  price: 15000,
  currency: "NGN",
  billingCycle: "monthly",
  features: ["Feature A"],
  description: "desc",
  isActive: true,
  displayOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
  toJSON() {
    const { toJSON: _, ...rest } = this;
    return rest;
  },
});

// ── createPricing ─────────────────────────────────────────────────────────────
describe("pricingService.createPricing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a plan when name is unique and payload is valid", async () => {
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(false);
    (pricingRepository.create as jest.Mock).mockResolvedValue(mockDoc());

    const result = await pricingService.createPricing(VALID_PRICING_CREATE);

    expect(pricingRepository.existsByName).toHaveBeenCalledWith("Starter Plan");
    expect(pricingRepository.create).toHaveBeenCalled();
    expect(result.name).toBe("Starter Plan");
  });

  it("throws 400 when name already exists", async () => {
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(true);

    await expect(
      pricingService.createPricing(VALID_PRICING_CREATE),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining("already exists"),
      }),
    );
  });

  it("throws 400 when price is negative", async () => {
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(false);

    await expect(
      pricingService.createPricing({ ...VALID_PRICING_CREATE, price: -100 }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining("negative"),
      }),
    );
  });

  it("throws 400 when features array is empty", async () => {
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(false);

    await expect(
      pricingService.createPricing({ ...VALID_PRICING_CREATE, features: [] }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("defaults currency to NGN and billingCycle to monthly when omitted", async () => {
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(false);
    (pricingRepository.create as jest.Mock).mockResolvedValue(mockDoc());

    const {
      currency: _c,
      billingCycle: _b,
      ...withoutDefaults
    } = VALID_PRICING_CREATE;
    await pricingService.createPricing(withoutDefaults as any);

    const createCall = (pricingRepository.create as jest.Mock).mock.calls[0][0];
    expect(createCall.currency).toBe("NGN");
    expect(createCall.billingCycle).toBe("monthly");
  });
});

// ── updatePricing (PUT) ───────────────────────────────────────────────────────
describe("pricingService.updatePricing", () => {
  const ID = "507f1f77bcf86cd799439011";
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("performs a full update when plan exists and name is unique", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(mockDoc());
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(false);
    (pricingRepository.update as jest.Mock).mockResolvedValue(
      mockDoc({ name: "Starter Plan Updated" }),
    );

    const result = await pricingService.updatePricing(ID, VALID_PRICING_PUT);
    expect(result.name).toBe("Starter Plan Updated");
    expect(pricingRepository.update).toHaveBeenCalledWith(
      ID,
      VALID_PRICING_PUT,
    );
  });

  it("throws 404 when plan does not exist", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      pricingService.updatePricing(ID, VALID_PRICING_PUT),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
  });

  it("throws 400 when new name collides with another plan", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(
      mockDoc({ name: "Old Name" }),
    );
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(true);

    await expect(
      pricingService.updatePricing(ID, VALID_PRICING_PUT),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining("already exists"),
      }),
    );
  });

  it("skips the name-uniqueness check when name has not changed", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(
      mockDoc({ name: "Starter Plan Updated" }),
    );
    (pricingRepository.update as jest.Mock).mockResolvedValue(mockDoc());

    await pricingService.updatePricing(ID, VALID_PRICING_PUT);
    expect(pricingRepository.existsByName).not.toHaveBeenCalled();
  });
});

// ── patchPricing (PATCH) ──────────────────────────────────────────────────────
describe("pricingService.patchPricing", () => {
  const ID = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("patches only the price when only price is sent", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(mockDoc());
    (pricingRepository.patch as jest.Mock).mockResolvedValue(
      mockDoc({ price: 99999 }),
    );

    const result = await pricingService.patchPricing(ID, { price: 99999 });
    expect(result.price).toBe(99999);
    expect(pricingRepository.patch).toHaveBeenCalledWith(ID, { price: 99999 });
  });

  it("throws 404 when plan does not exist", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      pricingService.patchPricing(ID, { price: 100 }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
  });

  it("throws 400 when patched name collides", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(
      mockDoc({ name: "Old" }),
    );
    (pricingRepository.existsByName as jest.Mock).mockResolvedValue(true);

    await expect(
      pricingService.patchPricing(ID, { name: "Colliding Name" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("does NOT run name check when name is unchanged", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(
      mockDoc({ name: "Same" }),
    );
    (pricingRepository.patch as jest.Mock).mockResolvedValue(mockDoc());

    await pricingService.patchPricing(ID, { name: "Same", price: 500 });
    expect(pricingRepository.existsByName).not.toHaveBeenCalled();
  });

  it("throws 400 when features is empty array", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(mockDoc());

    await expect(
      pricingService.patchPricing(ID, { features: [] }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("throws 400 when price is negative", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(mockDoc());

    await expect(
      pricingService.patchPricing(ID, { price: -50 }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});

// ── deletePricing ─────────────────────────────────────────────────────────────
describe("pricingService.deletePricing", () => {
  const ID = "507f1f77bcf86cd799439011";

  it("calls softDelete when plan exists", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(mockDoc());
    (pricingRepository.softDelete as jest.Mock).mockResolvedValue(mockDoc());

    await pricingService.deletePricing(ID);
    expect(pricingRepository.softDelete).toHaveBeenCalledWith(ID);
  });

  it("throws 404 for non-existent plan", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(pricingService.deletePricing(ID)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

// ── toggleActiveStatus ────────────────────────────────────────────────────────
describe("pricingService.toggleActiveStatus", () => {
  const ID = "507f1f77bcf86cd799439011";

  it("flips isActive from true → false", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(
      mockDoc({ isActive: true }),
    );
    (pricingRepository.patch as jest.Mock).mockResolvedValue(
      mockDoc({ isActive: false }),
    );

    const result = await pricingService.toggleActiveStatus(ID);
    expect(pricingRepository.patch).toHaveBeenCalledWith(ID, {
      isActive: false,
    });
    expect(result.isActive).toBe(false);
  });

  it("flips isActive from false → true", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(
      mockDoc({ isActive: false }),
    );
    (pricingRepository.patch as jest.Mock).mockResolvedValue(
      mockDoc({ isActive: true }),
    );

    const result = await pricingService.toggleActiveStatus(ID);
    expect(pricingRepository.patch).toHaveBeenCalledWith(ID, {
      isActive: true,
    });
    expect(result.isActive).toBe(true);
  });

  it("throws 404 for non-existent plan", async () => {
    (pricingRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(pricingService.toggleActiveStatus(ID)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

// ── getAllPricing ──────────────────────────────────────────────────────────────
describe("pricingService.getAllPricing", () => {
  it("defaults page to 1 and limit to 10", async () => {
    (pricingRepository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await pricingService.getAllPricing({});
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });

  it("caps limit at 100", async () => {
    (pricingRepository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await pricingService.getAllPricing({ limit: 999 });
    expect(result.pagination.limit).toBe(100);
  });

  it("calculates totalPages correctly", async () => {
    (pricingRepository.findAll as jest.Mock).mockResolvedValue({
      data: [mockDoc()],
      total: 25,
    });

    const result = await pricingService.getAllPricing({ limit: 10 });
    expect(result.pagination.totalPages).toBe(3); // ceil(25/10)
  });
});

// ── getActivePricing ──────────────────────────────────────────────────────────
describe("pricingService.getActivePricing", () => {
  it("returns only active plans via findActive", async () => {
    (pricingRepository.findActive as jest.Mock).mockResolvedValue([
      mockDoc({ name: "Active 1" }),
      mockDoc({ name: "Active 2" }),
    ]);

    const result = await pricingService.getActivePricing();
    expect(result).toHaveLength(2);
    expect(pricingRepository.findActive).toHaveBeenCalled();
  });
});

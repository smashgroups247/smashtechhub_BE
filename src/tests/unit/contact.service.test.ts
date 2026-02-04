// tests/unit/contact.service.test.ts
/**
 * Unit tests for contactService.
 * The real repository is fully mocked — no MongoDB required.
 */

jest.mock("@/domain/contact/repositories/contact.repository");

import { contactService } from "@/domain/contact/services/contact.service";
import { contactRepository } from "@/domain/contact/repositories/contact.repository";
import { VALID_CONTACT_CREATE } from "../setup/test-helpers";

// ── Minimal Mongoose-doc stub ─────────────────────────────────────────────────
const mockContactDoc = (overrides: Record<string, any> = {}) => ({
  _id: "507f1f77bcf86cd799439099",
  fullName: "Jane Smith",
  email: "jane@example.com",
  serviceOfInterest: "Web Development",
  projectDetails:
    "We need a full-stack e-commerce solution with payment integration.",
  status: "new",
  adminNotes: "",
  resolvedBy: null,
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
  toJSON() {
    const { toJSON: _, ...rest } = this;
    return rest;
  },
});

// ── createContact ─────────────────────────────────────────────────────────────
describe("contactService.createContact", () => {
  it("creates a submission when email is valid and not rate-limited", async () => {
    (contactRepository.hasRecentSubmission as jest.Mock).mockResolvedValue(
      false,
    );
    (contactRepository.create as jest.Mock).mockResolvedValue(mockContactDoc());

    const result = await contactService.createContact(VALID_CONTACT_CREATE);

    expect(contactRepository.hasRecentSubmission).toHaveBeenCalledWith(
      "jane@example.com",
      60,
    );
    expect(contactRepository.create).toHaveBeenCalledWith(VALID_CONTACT_CREATE);
    expect(result.fullName).toBe("Jane Smith");
  });

  it("throws 400 on invalid email format", async () => {
    await expect(
      contactService.createContact({
        ...VALID_CONTACT_CREATE,
        email: "not-an-email",
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining("email"),
      }),
    );
  });

  it("throws 429 when a recent submission exists for the same email", async () => {
    (contactRepository.hasRecentSubmission as jest.Mock).mockResolvedValue(
      true,
    );

    await expect(
      contactService.createContact(VALID_CONTACT_CREATE),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 429 }));
  });

  it("throws 400 when projectDetails is shorter than 10 chars", async () => {
    (contactRepository.hasRecentSubmission as jest.Mock).mockResolvedValue(
      false,
    );

    await expect(
      contactService.createContact({
        ...VALID_CONTACT_CREATE,
        projectDetails: "short",
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining("10 characters"),
      }),
    );
  });
});

// ── updateContactStatus (PATCH /:id/status) ──────────────────────────────────
describe("contactService.updateContactStatus", () => {
  const ID = "507f1f77bcf86cd799439099";

  it("updates status and sets resolvedBy when status → resolved", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );
    (contactRepository.updateStatus as jest.Mock).mockResolvedValue(
      mockContactDoc({
        status: "resolved",
        resolvedBy: "admin_123",
        resolvedAt: new Date(),
      }),
    );

    const result = await contactService.updateContactStatus(
      ID,
      { status: "resolved", adminNotes: "Handled." },
      "admin_123",
    );

    expect(result.status).toBe("resolved");
    // The service mutates data.resolvedBy before passing to repo
    expect(contactRepository.updateStatus).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ resolvedBy: "admin_123" }),
    );
  });

  it("does NOT set resolvedBy when status is not resolved", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );
    (contactRepository.updateStatus as jest.Mock).mockResolvedValue(
      mockContactDoc({ status: "in-progress" }),
    );

    await contactService.updateContactStatus(
      ID,
      { status: "in-progress" },
      "admin_123",
    );

    expect(contactRepository.updateStatus).toHaveBeenCalledWith(
      ID,
      expect.not.objectContaining({ resolvedBy: "admin_123" }),
    );
  });

  it("throws 404 when contact does not exist", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      contactService.updateContactStatus(ID, { status: "resolved" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
  });
});

// ── patchContact (PATCH /:id) ─────────────────────────────────────────────────
describe("contactService.patchContact", () => {
  const ID = "507f1f77bcf86cd799439099";

  it("patches only the fullName when only fullName is sent", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );
    (contactRepository.patch as jest.Mock).mockResolvedValue(
      mockContactDoc({ fullName: "Updated Name" }),
    );

    const result = await contactService.patchContact(ID, {
      fullName: "Updated Name",
    });
    expect(result.fullName).toBe("Updated Name");
    expect(contactRepository.patch).toHaveBeenCalledWith(ID, {
      fullName: "Updated Name",
    });
  });

  it("throws 404 when contact does not exist", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      contactService.patchContact(ID, { fullName: "X" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
  });

  it("throws 400 when serviceOfInterest is invalid", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );

    await expect(
      contactService.patchContact(ID, { serviceOfInterest: "InvalidService" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("throws 400 when patched projectDetails is too short", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );

    await expect(
      contactService.patchContact(ID, { projectDetails: "tiny" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("throws 400 when patched email is malformed", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );

    await expect(
      contactService.patchContact(ID, { email: "bad-email" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });

  it("accepts a valid serviceOfInterest without error", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );
    (contactRepository.patch as jest.Mock).mockResolvedValue(
      mockContactDoc({ serviceOfInterest: "UI/UX Design" }),
    );

    const result = await contactService.patchContact(ID, {
      serviceOfInterest: "UI/UX Design",
    });
    expect(result.serviceOfInterest).toBe("UI/UX Design");
  });
});

// ── deleteContact ─────────────────────────────────────────────────────────────
describe("contactService.deleteContact", () => {
  const ID = "507f1f77bcf86cd799439099";

  it("calls softDelete when contact exists", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );
    (contactRepository.softDelete as jest.Mock).mockResolvedValue(
      mockContactDoc(),
    );

    await contactService.deleteContact(ID);
    expect(contactRepository.softDelete).toHaveBeenCalledWith(ID);
  });

  it("throws 404 for non-existent contact", async () => {
    (contactRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(contactService.deleteContact(ID)).rejects.toThrow(
      expect.objectContaining({ statusCode: 404 }),
    );
  });
});

// ── getContactStats ───────────────────────────────────────────────────────────
describe("contactService.getContactStats", () => {
  it("delegates to repository and returns aggregation", async () => {
    const expected = { new: 5, inProgress: 3, resolved: 2, total: 10 };
    (contactRepository.getCountByStatus as jest.Mock).mockResolvedValue(
      expected,
    );

    const result = await contactService.getContactStats();
    expect(result).toEqual(expected);
  });
});

// ── getAllContacts ─────────────────────────────────────────────────────────────
describe("contactService.getAllContacts", () => {
  it("defaults page=1, limit=20", async () => {
    (contactRepository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await contactService.getAllContacts({});
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });

  it("caps limit at 100", async () => {
    (contactRepository.findAll as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await contactService.getAllContacts({ limit: 500 });
    expect(result.pagination.limit).toBe(100);
  });

  it("throws 400 when startDate > endDate", async () => {
    await expect(
      contactService.getAllContacts({
        startDate: "2026-06-01",
        endDate: "2026-01-01",
      }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
  });
});

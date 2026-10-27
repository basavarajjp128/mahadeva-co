import type { Metadata } from "next";
import Link from "next/link";
import {
  createUnitAction,
  deleteUnitAction,
  updateUnitAction,
} from "@/app/admin/(dashboard)/categories/actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit";
import { AdminAlert, AdminEmpty, AdminField, AdminPageHeader } from "@/components/admin/ui";
import { canEdit, requireAdmin } from "@/server/admin/auth";
import { listUnits } from "@/server/admin/categories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Measurement units",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const unitTypes = [
  { value: "weight", label: "Weight" },
  { value: "volume", label: "Volume" },
  { value: "count", label: "Count" },
  { value: "length", label: "Length" },
  { value: "other", label: "Other" },
] as const;

const savedMessages: Record<string, string> = {
  created: "Measurement unit created.",
  updated: "Measurement unit saved.",
  deleted: "Measurement unit deleted.",
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function typeLabel(value: string): string {
  return unitTypes.find((type) => type.value === value)?.label ?? value;
}

function formatConversion(value: string | null): string {
  if (!value) return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("en-IN", { maximumFractionDigits: 6 })
    : value;
}

export default async function AdminUnitsPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const writable = canEdit(admin.role);
  const params = await searchParams;
  const error = first(params.error);
  const saved = first(params.saved);
  const units = await listUnits();

  return (
    <>
      <AdminPageHeader
        actions={
          <Link className="admin-btn admin-btn--ghost" href="/admin/categories/">
            ← Back to categories
          </Link>
        }
        description="Measurement units describe how a product is sold. Conversion values let the shop compare kilograms, quintals and tonnes."
        eyebrow="Catalogue"
        title="Measurement units"
      />

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}
      {saved && savedMessages[saved] ? (
        <AdminAlert variant="success">{savedMessages[saved]}</AdminAlert>
      ) : null}

      <section className="admin-card">
        <div className="admin-card__head">
          <h2>Units</h2>
          <span className="admin-card__hint">
            {units.length} {units.length === 1 ? "unit" : "units"}
          </span>
        </div>

        {units.length === 0 ? (
          <AdminEmpty description="Add the first unit below." title="No units yet" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Unit</th>
                  <th scope="col">Type</th>
                  <th scope="col">Base</th>
                  <th scope="col">Used in</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="admin-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td>
                      <span className="admin-table__primary">
                        {unit.name} ({unit.symbol})
                      </span>
                      <span className="admin-table__sub">{unit.id.slice(0, 8)}</span>
                    </td>
                    <td>{typeLabel(unit.unitType)}</td>
                    <td>
                      {unit.baseUnitSymbol
                        ? `${formatConversion(unit.conversionToBase)} ${unit.baseUnitSymbol}`
                        : "—"}
                    </td>
                    <td>{unit.optionCount}</td>
                    <td>
                      <span
                        className={`admin-badge admin-badge--${unit.isActive ? "active" : "inactive"}`}
                      >
                        {unit.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="admin-table__actions">
                      {writable ? (
                        <>
                          <details className="admin-details">
                            <summary className="admin-btn admin-btn--small">Edit</summary>
                            <form
                              action={updateUnitAction.bind(null, unit.id)}
                              className="admin-details__body admin-form"
                            >
                              <div className="admin-form__grid">
                                <AdminField id={`name-${unit.id}`} label="Name">
                                  <input
                                    className="admin-input"
                                    defaultValue={unit.name}
                                    id={`name-${unit.id}`}
                                    maxLength={40}
                                    name="name"
                                    required
                                  />
                                </AdminField>
                                <AdminField id={`symbol-${unit.id}`} label="Symbol">
                                  <input
                                    className="admin-input"
                                    defaultValue={unit.symbol}
                                    id={`symbol-${unit.id}`}
                                    maxLength={12}
                                    name="symbol"
                                    required
                                  />
                                </AdminField>
                              </div>
                              <div className="admin-form__grid">
                                <AdminField id={`type-${unit.id}`} label="Unit type">
                                  <select
                                    className="admin-input"
                                    defaultValue={unit.unitType}
                                    id={`type-${unit.id}`}
                                    name="unitType"
                                  >
                                    {unitTypes.map((type) => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </AdminField>
                                <AdminField
                                  hint="e.g. kg for weight units."
                                  id={`base-${unit.id}`}
                                  label="Base unit symbol"
                                >
                                  <input
                                    className="admin-input"
                                    defaultValue={unit.baseUnitSymbol ?? ""}
                                    id={`base-${unit.id}`}
                                    maxLength={12}
                                    name="baseUnitSymbol"
                                  />
                                </AdminField>
                              </div>
                              <AdminField
                                hint="How many base units this unit equals, e.g. 100 for a quintal of kilograms."
                                id={`conversion-${unit.id}`}
                                label="Conversion to base"
                              >
                                <input
                                  className="admin-input"
                                  defaultValue={unit.conversionToBase ?? ""}
                                  id={`conversion-${unit.id}`}
                                  inputMode="decimal"
                                  name="conversionToBase"
                                  placeholder="1"
                                />
                              </AdminField>
                              <label className="admin-check" htmlFor={`active-${unit.id}`}>
                                <input
                                  defaultChecked={unit.isActive}
                                  id={`active-${unit.id}`}
                                  name="isActive"
                                  type="checkbox"
                                />
                                <span>
                                  <strong>Active</strong>
                                  <span>Hidden units cannot be selected for new options.</span>
                                </span>
                              </label>
                              <div className="admin-form__actions">
                                <button
                                  className="admin-btn admin-btn--primary admin-btn--small"
                                  type="submit"
                                >
                                  Save unit
                                </button>
                              </div>
                            </form>
                          </details>
                          <form action={deleteUnitAction.bind(null, unit.id)}>
                            <ConfirmSubmitButton
                              message={`Delete the ${unit.name} unit? Units used by category options cannot be deleted.`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {writable ? (
        <section className="admin-card admin-card--form">
          <div className="admin-card__head">
            <h2>New unit</h2>
          </div>
          <form action={createUnitAction} className="admin-form">
            <div className="admin-form__grid">
              <AdminField id="new-name" label="Name">
                <input className="admin-input" id="new-name" maxLength={40} name="name" required />
              </AdminField>
              <AdminField hint="Shown next to quantities, e.g. kg." id="new-symbol" label="Symbol">
                <input className="admin-input" id="new-symbol" maxLength={12} name="symbol" required />
              </AdminField>
            </div>
            <div className="admin-form__grid">
              <AdminField id="new-type" label="Unit type">
                <select className="admin-input" defaultValue="weight" id="new-type" name="unitType">
                  {unitTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField hint="e.g. kg for grams." id="new-base" label="Base unit symbol">
                <input className="admin-input" id="new-base" maxLength={12} name="baseUnitSymbol" />
              </AdminField>
            </div>
            <AdminField
              hint="How many base units one of this unit equals. Leave blank when not applicable."
              id="new-conversion"
              label="Conversion to base"
            >
              <input
                className="admin-input"
                id="new-conversion"
                inputMode="decimal"
                name="conversionToBase"
                placeholder="1"
              />
            </AdminField>
            <label className="admin-check" htmlFor="new-active">
              <input defaultChecked id="new-active" name="isActive" type="checkbox" />
              <span>
                <strong>Active</strong>
                <span>Active units can be selected for category options.</span>
              </span>
            </label>
            <div className="admin-form__actions">
              <button className="admin-btn admin-btn--primary" type="submit">
                Create unit
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}

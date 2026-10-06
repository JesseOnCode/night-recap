import { Fragment } from "react";

export function ColumnLegend({
  columns,
}: {
  columns: { label: string; meaning?: string }[];
}) {
  const items = columns.filter((column) => column.meaning);

  if (items.length === 0) {
    return null;
  }

  return (
    <p className="column-legend">
      {items.map((column, index) => (
        <Fragment key={column.label}>
          {index > 0 ? <span className="legend-dot"> · </span> : null}
          <span className="legend-term">
            <span className="legend-key">{column.label}</span> {column.meaning}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

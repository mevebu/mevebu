// Builds a Markdown table cell by cell, with per-column alignment.
import { el, bench, stack, panel, row, textInput, selectInput, button, output, copyButton, actions, toolcard } from "../core.js";

const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").trim();

export function mount(slot) {
  const columns = ["left", "left", "left"];
  const rows = [["Name", "Role", "City"], ["Ada", "Engineer", "London"]];
  const editor = el("div", { class: "max-h-80 overflow-auto" });
  const alignment = el("div", { class: "grid content-start gap-4" });
  const result = output({ rows: 8 });

  const toMarkdown = () => {
    const head = rows[0] ?? [];
    const marks = columns.map((align) => (align === "center" ? ":---:" : align === "right" ? "---:" : ":---"));
    const lines = [
      `| ${columns.map((_, index) => cell(head[index])).join(" | ")} |`,
      `| ${marks.join(" | ")} |`];
    for (let r = 1; r < rows.length; r++) {
      lines.push(`| ${columns.map((_, index) => cell(rows[r][index])).join(" | ")} |`);
    }
    return lines.join("\n");
  };

  const update = () => { result.write(toMarkdown()); };

  function paintEditor() {
    const table = el("table", { class: "w-full border-collapse font-mono text-sm [&_th]:wrap-anywhere [&_td]:wrap-anywhere [&_th]:border-b [&_td]:border-b [&_th]:border-orbit [&_td]:border-orbit [&_th]:px-2.5 [&_td]:px-2.5 [&_th]:py-2 [&_td]:py-2 [&_th]:text-start [&_td]:text-start [&_th]:font-sans [&_th]:text-2xs [&_th]:font-semibold [&_th]:text-ink-2 [&_tbody>tr:last-child>th]:border-b-0 [&_tbody>tr:last-child>td]:border-b-0" });
    const headRow = el("tr");
    for (let c = 0; c < columns.length; c++) {
      const input = textInput({ value: rows[0][c] ?? "", "aria-label": `Column ${c + 1} header` });
      input.addEventListener("input", () => { rows[0][c] = input.value; update(); });
      headRow.append(el("th", {}, input));
    }
    table.append(el("thead", {}, headRow));
    const body = el("tbody");
    for (let r = 1; r < rows.length; r++) {
      const bodyRow = el("tr");
      for (let c = 0; c < columns.length; c++) {
        const input = textInput({ value: rows[r][c] ?? "", "aria-label": `Row ${r} column ${c + 1}` });
        input.addEventListener("input", () => { rows[r][c] = input.value; update(); });
        bodyRow.append(el("td", {}, input));
      }
      body.append(bodyRow);
    }
    table.append(body);
    editor.replaceChildren(table);
    update();
  }

  function paintAlignment() {
    alignment.replaceChildren(
      ...columns.map((align, index) => {
        const select = selectInput(
          [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }],
          { value: align, "aria-label": `Column ${index + 1} alignment` }
        );
        select.addEventListener("change", () => { columns[index] = select.value; update(); });
        return panel(`Column ${index + 1}`, select);
      })
    );
  }

  function paint() {
    paintAlignment();
    paintEditor();
  }

  const addColumn = button("Add column", { icon: "plus" });
  addColumn.addEventListener("click", () => {
    columns.push("left");
    for (const entry of rows) entry.push("");
    paint();
  });

  const removeColumn = button("Remove column", { icon: "minus" });
  removeColumn.addEventListener("click", () => {
    if (columns.length <= 1) return;
    columns.pop();
    for (const entry of rows) entry.pop();
    paint();
  });

  const addRow = button("Add row", { icon: "plus" });
  addRow.addEventListener("click", () => {
    rows.push(columns.map(() => ""));
    paintEditor();
  });

  const removeRow = button("Remove row", { icon: "minus" });
  removeRow.addEventListener("click", () => {
    if (rows.length <= 2) return;
    rows.pop();
    paintEditor();
  });

  const card = toolcard({
    body: bench(
      stack(panel("Columns", row(addColumn, removeColumn)), panel("Rows", row(addRow, removeRow)), panel("Alignment", alignment)),
      stack(panel("Cells", editor), panel("Markdown", result))
    ),
    foot: actions(copyButton(() => result.textContent, "Copy table", "fill"))});
  slot.append(card.node);
  paint();

  return {};
}

export default { mount };

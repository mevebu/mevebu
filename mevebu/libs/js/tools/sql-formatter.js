// Indents a SQL query clause by clause. Keywords can be upper-cased.
import { bench, stack, panel, textArea, notice, switchControl, copyButton, actions, toolcard } from "../core.js";

const CLAUSES = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "VALUES", "SET",
  "INSERT INTO", "UPDATE", "DELETE FROM", "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN",
  "CROSS JOIN", "JOIN", "UNION ALL", "UNION", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "WITH", "RETURNING",
];
const WORDS = [...CLAUSES, "AND", "OR", "ON", "AS", "IN", "IS", "NOT", "NULL", "LIKE", "BETWEEN", "DISTINCT", "ASC", "DESC", "CASE", "WHEN", "THEN", "ELSE", "END"];

const toPattern = (word) => word.replace(/ /g, "\\s+");

function protect(sql) {
  const store = [];
  const text = sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|`[^`]*`/g, (match) => {
    store.push(match);
    return `\u0001${store.length - 1}\u0001`;
  });
  return { text, store };
}

const restore = (text, store) => text.replace(/\u0001(\d+)\u0001/g, (_, index) => store[Number(index)]);

function format(sql, upper) {
  const cleaned = sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
  const { text, store } = protect(cleaned);
  let out = text.replace(/\s+/g, " ").trim();
  if (upper) {
    const wordRe = new RegExp(`\\b(${[...WORDS].sort((a, b) => b.length - a.length).map(toPattern).join("|")})\\b`, "gi");
    out = out.replace(wordRe, (match) => match.toUpperCase());
  }
  const clauseRe = new RegExp(`\\s*(${[...CLAUSES].sort((a, b) => b.length - a.length).map(toPattern).join("|")})\\b`, "gi");
  out = out.replace(clauseRe, "\n$1");
  out = out.replace(/\s*\b(AND|OR)\b/gi, "\n  $1");
  out = out.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  out = out.replace(/\n{3,}/g, "\n\n").trim();
  return restore(out, store);
}

export function mount(slot) {
  const source = textArea({
    rows: 12,
    class: "mvb-in mvb-in--area mvb-in--mono",
    "aria-label": "SQL",
    value: "select id, name from users where active = true and age > 18 order by name",
  });
  const result = textArea({ rows: 12, readonly: true, class: "mvb-in mvb-in--area mvb-in--mono", "aria-label": "Formatted SQL" });
  const error = notice("error");
  let upper = true;

  const casing = switchControl("Upper-case keywords", { checked: true });
  casing.input.addEventListener("change", () => { upper = casing.input.checked; run(); });

  function run() {
    error.write("");
    if (!source.value.trim()) {
      result.value = "";
      return;
    }
    result.value = format(source.value, upper);
  }

  source.addEventListener("input", run);

  const card = toolcard({
    body: bench(
      stack(panel("Options", casing), panel("SQL", source), error),
      stack(panel("Formatted", result))
    ),
    foot: actions(copyButton(() => result.value, "Copy query", "fill")),
  });
  slot.append(card.node);
  run();

  return {};
}

export default { mount };

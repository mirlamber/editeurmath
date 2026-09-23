let activeEditor = null;
let exerciseCount = 0;

// ======================================================
// CRÉATION D'UN EXERCICE
// ======================================================

function createExercise() {
  exerciseCount++;

  const block = document.createElement("div");
  block.className = "exercise-block";

  // Titre de l'exercice
  const title = document.createElement("h2");
  title.className = "exercise-title";
  title.contentEditable = "true";
  title.spellcheck = false;
  title.textContent = `Exercice ${exerciseCount}`;

  // Zone d'amorce / consigne (ex: Le triangle ABC est rectangle en A...)
  const intro = document.createElement("div");
  intro.className = "exercise-intro";
  intro.contentEditable = "true";
  intro.spellcheck = false;

  // Conteneur flexible pour alterner texte et calculs
  const content = document.createElement("div");
  content.className = "exercise-content";

  // Barre d'outils propre à l'exercice
  const btns = document.createElement("div");
  btns.className = "exercise-buttons";

  const addCalculBtn = document.createElement("button");
  addCalculBtn.className = "btn btn-small btn-calcul";
  addCalculBtn.textContent = "＋ Ligne de calcul (=)";
  addCalculBtn.addEventListener("click", () => createCalculRow(content, true));

  const addTextBtn = document.createElement("button");
  addTextBtn.className = "btn btn-small btn-text";
  addTextBtn.textContent = "＋ Phrase / Conclusion";
  addTextBtn.addEventListener("click", () => createTextRow(content, true));

  btns.append(addCalculBtn, addTextBtn);
  block.append(title, intro, content, btns);

  document.getElementById("exercises-container").appendChild(block);

  // Première ligne de calcul par défaut
  createCalculRow(content, false);
}

// ======================================================
// LIGNE DE CALCUL ([Gauche] = [Droite])
// ======================================================

function createCalculRow(container, focusLeft = false) {
  const row = document.createElement("div");
  row.className = "row calcul-row";

  const left = document.createElement("div");
  left.className = "side left";
  left.contentEditable = "true";
  left.spellcheck = false;

  const equals = document.createElement("div");
  equals.className = "equals";
  equals.textContent = "=";

  const right = document.createElement("div");
  right.className = "side right";
  right.contentEditable = "true";
  right.spellcheck = false;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-row-btn";
  deleteBtn.innerHTML = "✕";
  deleteBtn.title = "Supprimer cette ligne";
  deleteBtn.tabIndex = -1;
  deleteBtn.addEventListener("click", () => row.remove());

  row.append(left, equals, right, deleteBtn);

  // Insère sous la ligne active si elle existe dans le même bloc, sinon à la fin
  const activeRow = activeEditor ? activeEditor.closest(".row, .text-row") : null;
  if (activeRow && activeRow.parentElement === container) {
    activeRow.after(row);
  } else {
    container.appendChild(row);
  }

  if (focusLeft) {
    left.focus();
    activeEditor = left;
  }
}

// ======================================================
// LIGNE DE TEXTE
// ======================================================

function createTextRow(container, focus = false) {
  const row = document.createElement("div");
  row.className = "text-row";

  const input = document.createElement("div");
  input.className = "text-input";
  input.contentEditable = "true";
  input.spellcheck = false;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-row-btn";
  deleteBtn.innerHTML = "✕";
  deleteBtn.title = "Supprimer cette ligne";
  deleteBtn.tabIndex = -1;
  deleteBtn.addEventListener("click", () => row.remove());

  row.append(input, deleteBtn);

  // Insère sous la ligne active si elle existe dans le même bloc, sinon à la fin
  const activeRow = activeEditor ? activeEditor.closest(".row, .text-row") : null;
  if (activeRow && activeRow.parentElement === container) {
    activeRow.after(row);
  } else {
    container.appendChild(row);
  }

  if (focus) {
    input.focus();
    activeEditor = input;
  }
}

// Initialisation
createExercise();

document.getElementById("addExercise").addEventListener("click", () => {
  createExercise();
});

// ======================================================
// DÉTECTION DE LA ZONE ACTIVE
// ======================================================

document.getElementById("exercises-container").addEventListener("focusin", (e) => {
  const t = e.target;
  if (
    t.classList.contains("side") ||
    t.classList.contains("text-input") || // <--- ICI
    t.classList.contains("exercise-intro") ||
    t.classList.contains("math-zone") ||
    t.classList.contains("exponent-editable") ||
    t.classList.contains("sqrt-content")
  ) {
    activeEditor = t;
  }
});

// ======================================================
// TOUCHE ENTRÉE (Duplique le type de ligne courant)
// ======================================================

document.getElementById("exercises-container").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    const target = e.target;
    const container = target.closest(".exercise-content");

    if (target.classList.contains("side")) {
      e.preventDefault();
      if (container) createCalculRow(container, true);
    } else if (target.classList.contains("text-input")) { // <--- ICI
      e.preventDefault();
      if (container) createTextRow(container, true);
    }
  }
});

// ======================================================
// SORTIR D'UN OBJET MATHÉMATIQUE AVEC →
// ======================================================

document.getElementById("exercises-container").addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight") return;

  const currentZone = e.target.closest(".math-zone, .exponent-editable, .sqrt-content");
  if (!currentZone) return;

  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);

  try {
    const testRange = document.createRange();
    testRange.selectNodeContents(currentZone);
    testRange.setStart(range.endContainer, range.endOffset);
    if (testRange.toString().length > 0) return;
  } catch (err) {}

  e.preventDefault();

  const fraction = currentZone.closest(".fraction");
  if (fraction && currentZone.classList.contains("num")) {
    const denominator = fraction.querySelector(".den");
    activeEditor = denominator;
    denominator.focus();
    
    const newRange = document.createRange();
    newRange.selectNodeContents(denominator);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return;
  }

  const mathObject = currentZone.closest(".math-object, .exponent");
  if (mathObject) {
    exitMathObject(mathObject);
  }
});

function exitMathObject(mathObject) {
  const parent = mathObject.closest(".side");
  if (!parent) return;

  activeEditor = parent;
  parent.focus();

  const marker = document.createTextNode("\u200B");
  if (mathObject.nextSibling) {
    parent.insertBefore(marker, mathObject.nextSibling);
  } else {
    parent.appendChild(marker);
  }

  const range = document.createRange();
  range.setStart(marker, 1);
  range.collapse(true);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

// ======================================================
// REMPLACEMENT AUTOMATIQUE (* -> × et x -> 𝑥)
// Uniquement dans les zones mathématiques !
// ======================================================

function isMathZone(el) {
  return (
    el.classList.contains("side") ||
    el.classList.contains("math-zone") ||
    el.classList.contains("exponent-editable") ||
    el.classList.contains("sqrt-content")
  );
}

document.getElementById("exercises-container").addEventListener("input", (e) => {
  const zone = e.target;
  if (!isMathZone(zone)) return;

  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const node = range.startContainer;

  if (node.nodeType !== Node.TEXT_NODE) return;

  const text = node.nodeValue;
  const offset = range.startOffset;

  if (offset <= 0) return;

  const lastChar = text[offset - 1];
  let replacement = null;

  if (lastChar === "*") replacement = "×";
  else if (lastChar === "x") replacement = "𝑥";

  if (replacement) {
    const replaceRange = document.createRange();
    replaceRange.setStart(node, offset - 1);
    replaceRange.setEnd(node, offset);

    const newNode = document.createTextNode(replacement);
    replaceRange.deleteContents();
    replaceRange.insertNode(newNode);

    const newRange = document.createRange();
    newRange.setStartAfter(newNode);
    newRange.collapse(true);

    selection.removeAllRanges();
    selection.addRange(newRange);
  }
});

// ======================================================
// FONCTIONS D'INSERTION MATHÉMATIQUES
// ======================================================

function insertText(text) {
  if (!activeEditor) return;
  activeEditor.focus();

  const selection = window.getSelection();
  if (!selection.rangeCount) {
    activeEditor.appendChild(document.createTextNode(text));
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
}

function createMathZone(className = "") {
  const zone = document.createElement("span");
  zone.className = "math-zone " + className;
  zone.contentEditable = "true";
  zone.spellcheck = false;
  return zone;
}

function insertPower() {
  if (!activeEditor) return;
  const exponent = document.createElement("span");
  exponent.className = "exponent";
  exponent.contentEditable = "false";

  const zone = document.createElement("span");
  zone.className = "exponent-editable";
  zone.contentEditable = "true";
  zone.spellcheck = false;
  zone.textContent = "n";

  exponent.appendChild(zone);
  insertElement(exponent);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(zone);
  selection.removeAllRanges();
  selection.addRange(range);

  zone.focus();
  activeEditor = zone;
}

function insertSquareRoot() {
  if (!activeEditor) return;

  const sqrt = document.createElement("span");
  sqrt.className = "math-object sqrt";
  sqrt.contentEditable = "false";

  // Symbole vectoriel SVG parfait
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "sqrt-svg");
  svg.setAttribute("viewBox", "0 0 12 18");
  svg.innerHTML = '<path d="M1 10 L4 10 L7 17 L11 1" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';

  const content = document.createElement("span");
  content.className = "sqrt-content";
  content.contentEditable = "true";
  content.spellcheck = false;

  sqrt.append(svg, content);
  insertElement(sqrt);

  content.focus();
  activeEditor = content;
}

function insertFraction() {
  if (!activeEditor) return;
  const fraction = document.createElement("span");
  fraction.className = "math-object fraction";
  fraction.contentEditable = "false";

  const numerator = createMathZone("num");
  const line = document.createElement("span");
  line.className = "fraction-line";
  const denominator = createMathZone("den");

  fraction.append(numerator, line, denominator);
  insertElement(fraction);

  numerator.focus();
  activeEditor = numerator;
}

function insertSquare() {
  if (!activeEditor) return;
  const exponent = document.createElement("span");
  exponent.className = "exponent";
  exponent.contentEditable = "false";
  exponent.textContent = "2";
  insertElement(exponent);
}

function insertElement(element) {
  activeEditor.focus();
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    activeEditor.appendChild(element);
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(element);
  placeCursorAfter(element);
}

function placeCursorAfter(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStartAfter(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

document.querySelectorAll(".math-button").forEach((button) => {
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    const text = button.dataset.insert;

    if (text) insertText(text);
    else if (action === "square") insertSquare();
    else if (action === "power") insertPower();
    else if (action === "sqrt") insertSquareRoot();
    else if (action === "fraction") insertFraction();
  });
});


const ESC = 0x1b;
const GS = 0x1d;

const COMMANDS = {
  INIT: [ESC, 0x40],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_ON: [GS, 0x21, 0x11],
  DOUBLE_OFF: [GS, 0x21, 0x00],
  CUT: [GS, 0x56, 0x00],
  FEED: [ESC, 0x64, 0x03],
};

const PAPER_WIDTHS = {
  "58": 32,
  "80": 48,
};

const encoder = new TextEncoder();

function toBytes(value) {
  return value instanceof Uint8Array
    ? value
    : new Uint8Array(value);
}

function concatBytes(...chunks) {
  const arrays = chunks.map(toBytes);
  const totalLength = arrays.reduce(
    (sum, item) => sum + item.length,
    0
  );

  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
}

function encodeText(value) {
  // Basic ESC/POS text encoding.
  // Hindi/Unicode text may require printer-specific code-page
  // support or raster-image printing.
  return encoder.encode(String(value ?? ""));
}

function getLineWidth(paperWidth = "80") {
  return PAPER_WIDTHS[String(paperWidth)] || PAPER_WIDTHS["80"];
}

function separator(paperWidth = "80", character = "-") {
  return character.repeat(getLineWidth(paperWidth));
}

function padRight(value, width) {
  const text = String(value ?? "");
  return text.length >= width
    ? text.slice(0, width)
    : text + " ".repeat(width - text.length);
}

function padLeft(value, width) {
  const text = String(value ?? "");
  return text.length >= width
    ? text.slice(-width)
    : " ".repeat(width - text.length) + text;
}

function twoColumn(left, right, paperWidth = "80") {
  const width = getLineWidth(paperWidth);
  const leftText = String(left ?? "");
  const rightText = String(right ?? "");

  const availableLeft = Math.max(
    1,
    width - rightText.length - 1
  );

  return (
    padRight(leftText, availableLeft) +
    " " +
    padLeft(rightText, rightText.length)
  ).slice(0, width);
}

function wrapText(value, paperWidth = "80") {
  const width = getLineWidth(paperWidth);
  const words = String(value ?? "").split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;

    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }

      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }

      continue;
    }

    const next = current ? `${current} ${word}` : word;

    if (next.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);

  return lines;
}

export function createEscPosBuilder(paperWidth = "80") {
  const chunks = [];

  const add = (bytes) => {
    chunks.push(new Uint8Array(bytes));
  };

  const addText = (value) => {
    chunks.push(encodeText(value));
  };

  const builder = {
    init() {
      add(COMMANDS.INIT);
      return this;
    },

    alignLeft() {
      add(COMMANDS.ALIGN_LEFT);
      return this;
    },

    alignCenter() {
      add(COMMANDS.ALIGN_CENTER);
      return this;
    },

    alignRight() {
      add(COMMANDS.ALIGN_RIGHT);
      return this;
    },

    bold(enabled = true) {
      add(enabled ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF);
      return this;
    },

    doubleSize(enabled = true) {
      add(enabled ? COMMANDS.DOUBLE_ON : COMMANDS.DOUBLE_OFF);
      return this;
    },

    text(value) {
      addText(value);
      return this;
    },

    line(value = "") {
      addText(value);
      addText("\n");
      return this;
    },

    wrappedText(value) {
      wrapText(value, paperWidth).forEach((line) => {
        this.line(line);
      });

      return this;
    },

    separator(character = "-") {
      this.line(separator(paperWidth, character));
      return this;
    },

    columns(left, right) {
      this.line(twoColumn(left, right, paperWidth));
      return this;
    },

    feed(lines = 1) {
      const count = Math.max(0, Math.min(255, Number(lines) || 0));
      add([ESC, 0x64, count]);
      return this;
    },

    cut() {
      add(COMMANDS.CUT);
      return this;
    },

    raw(bytes) {
      chunks.push(toBytes(bytes));
      return this;
    },

    build() {
      return concatBytes(...chunks);
    },
  };

  return builder;
}

export function buildReceiptDocument({
  paperWidth = "80",
  sections = [],
  cut = true,
}) {
  const builder = createEscPosBuilder(paperWidth);

  builder.init();

  sections.forEach((section) => {
    switch (section.type) {
      case "center":
        builder.alignCenter().wrappedText(section.text);
        break;

      case "right":
        builder.alignRight().wrappedText(section.text);
        break;

      case "bold":
        builder.bold(true).wrappedText(section.text).bold(false);
        break;

      case "separator":
        builder.separator(section.character || "-");
        break;

      case "columns":
        builder.alignLeft().columns(section.left, section.right);
        break;

      case "feed":
        builder.feed(section.lines || 1);
        break;

      case "text":
      default:
        builder.alignLeft().wrappedText(section.text || "");
        break;
    }
  });

  builder.feed(3);

  if (cut) {
    builder.cut();
  }

  return builder.build();
}

export {
  PAPER_WIDTHS,
  getLineWidth,
  separator,
  twoColumn,
  wrapText,
};

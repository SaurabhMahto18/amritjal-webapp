
const ESC = 0x1b;
const GS = 0x1d;

export const PAPER_WIDTHS = {
  "58": 32,
  "80": 48,
};

export const ESC_POS_COMMANDS = {
  INIT: [ESC, 0x40],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_ON: [GS, 0x21, 0x11],
  DOUBLE_OFF: [GS, 0x21, 0x00],
  CUT: [GS, 0x56, 0x00],
};

const encoder = new TextEncoder();

export function normalizeBytes(data) {
  if (data instanceof Uint8Array) return data;

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(
      data.buffer,
      data.byteOffset,
      data.byteLength
    );
  }

  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }

  throw new Error("Invalid ESC/POS data.");
}

function concatBytes(...parts) {
  const arrays = parts.map(normalizeBytes);

  const length = arrays.reduce(
    (sum, part) => sum + part.length,
    0
  );

  const output = new Uint8Array(length);

  let offset = 0;

  arrays.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

export function getLineWidth(paperWidth = "80") {
  return PAPER_WIDTHS[String(paperWidth)] || PAPER_WIDTHS["80"];
}

export function separator(paperWidth = "80", char = "-") {
  return String(char || "-").repeat(
    getLineWidth(paperWidth)
  );
}

export function wrapText(text, width) {
  const words = String(text ?? "").split(/\s+/);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    if (!word) return;

    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }

      for (let i = 0; i < word.length; i += width) {
        lines.push(word.slice(i, i + width));
      }

      return;
    }

    const candidate = current
      ? `${current} ${word}`
      : word;

    if (candidate.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) lines.push(current);

  return lines;
}

export function twoColumn(
  left,
  right,
  paperWidth = "80"
) {
  const width = getLineWidth(paperWidth);

  const leftText = String(left ?? "");
  const rightText = String(right ?? "");

  const availableLeft = Math.max(
    1,
    width - rightText.length - 1
  );

  const leftLines = wrapText(leftText, availableLeft);

  const firstLeft = leftLines.shift() || "";

  const spaces = Math.max(
    1,
    width - firstLeft.length - rightText.length
  );

  return [
    `${firstLeft}${" ".repeat(spaces)}${rightText}`,
    ...leftLines,
  ].join("\n");
}

export function createEscPosBuilder(
  paperWidth = "80",
  options = {}
) {
  const width = getLineWidth(paperWidth);
  const parts = [];

  const push = (...values) => {
    parts.push(new Uint8Array(values));
  };

  const pushText = (value) => {
    parts.push(encoder.encode(String(value ?? "")));
  };

  const builder = {
    init() {
      parts.push(
        new Uint8Array(ESC_POS_COMMANDS.INIT)
      );

      return builder;
    },

    align(value = "left") {
      const command =
        value === "center"
          ? ESC_POS_COMMANDS.ALIGN_CENTER
          : value === "right"
            ? ESC_POS_COMMANDS.ALIGN_RIGHT
            : ESC_POS_COMMANDS.ALIGN_LEFT;

      parts.push(new Uint8Array(command));

      return builder;
    },

    bold(enabled = true) {
      parts.push(
        new Uint8Array(
          enabled
            ? ESC_POS_COMMANDS.BOLD_ON
            : ESC_POS_COMMANDS.BOLD_OFF
        )
      );

      return builder;
    },

    doubleSize(enabled = true) {
      parts.push(
        new Uint8Array(
          enabled
            ? ESC_POS_COMMANDS.DOUBLE_ON
            : ESC_POS_COMMANDS.DOUBLE_OFF
        )
      );

      return builder;
    },

    text(value = "") {
      pushText(`${String(value)}\n`);
      return builder;
    },

    line(value = "") {
      return builder.text(value);
    },

    wrappedText(value = "") {
      wrapText(value, width).forEach((item) => {
        builder.text(item);
      });

      return builder;
    },

    separator(char = "-") {
      return builder.text(
        separator(paperWidth, char)
      );
    },

    columns(left, right) {
      const formatted = twoColumn(
        left,
        right,
        paperWidth
      );

      formatted.split("\n").forEach((item) => {
        builder.text(item);
      });

      return builder;
    },

    feed(lines = 1) {
      const count = Math.max(
        0,
        Math.min(20, Number(lines) || 0)
      );

      push(0x1b, 0x64, count);

      return builder;
    },

    cut() {
      if (options.cutEnabled === false) {
        return builder;
      }

      parts.push(
        new Uint8Array(ESC_POS_COMMANDS.CUT)
      );

      return builder;
    },

    raw(data) {
      parts.push(normalizeBytes(data));
      return builder;
    },

    build() {
      return concatBytes(...parts);
    },
  };

  return builder;
}

export function buildReceiptDocument({
  paperWidth = "80",
  sections = [],
  cut = false,
  feedLines = 3,
} = {}) {
  const builder = createEscPosBuilder(paperWidth);

  builder.init();

  sections.forEach((section) => {
    switch (section.type) {
      case "center":
        builder.align("center");
        builder.text(section.text);
        builder.align("left");
        break;

      case "right":
        builder.align("right");
        builder.text(section.text);
        builder.align("left");
        break;

      case "bold":
        builder.bold(true);
        builder.wrappedText(section.text);
        builder.bold(false);
        break;

      case "separator":
        builder.separator(section.char || "-");
        break;

      case "columns":
        builder.columns(section.left, section.right);
        break;

      case "feed":
        builder.feed(section.lines ?? 1);
        break;

      case "raw":
        builder.raw(section.data);
        break;

      default:
        builder.wrappedText(section.text || "");
    }
  });

  builder.feed(feedLines);

  if (cut) {
    builder.cut();
  }

  return builder.build();
}

export function buildSimpleReceipt({
  title = "AMRIT JAL",
  message = "Printer test successful",
  paperWidth = "80",
} = {}) {
  const builder = createEscPosBuilder(paperWidth);

  builder.init();
  builder.align("center");
  builder.bold(true);
  builder.text(title);
  builder.bold(false);
  builder.text(message);
  builder.align("left");
  builder.feed(4);

  return builder.build();
}

import "./style.css";

enum Stickers {
  Heart = "❤️",
  Star = "⭐",
  Smile = "😊",
}

interface LineStyle {
  width: number;
  color: string;
}

class MarkerLine {
  private points: Array<{ x: number; y: number }> = [];
  private lineWidth: number;
  private lineColor: string;

  constructor(
    initialX: number,
    initialY: number,
    lineWidth: number,
    lineColor: string
  ) {
    this.points.push({ x: initialX, y: initialY });
    this.lineWidth = lineWidth;
    this.lineColor = lineColor;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length < 2) return;

    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.lineColor;
    ctx.beginPath();
    for (let i = 0; i < this.points.length - 1; i++) {
      ctx.moveTo(this.points[i].x, this.points[i].y);
      ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
    }
    ctx.stroke();
  }
}

class StickerPreview {
  public x: number;
  public y: number;
  public sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  update(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "48px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

class StickerCommand {
  public x: number;
  public y: number;
  public sticker: string;
  public rotation: number = 0;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.font = "48px Arial";
    ctx.fillText(this.sticker, 0, 0);
    ctx.restore();
  }
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  emoji: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.font = `${size}px serif`;
  ctx.fillText(emoji, -size / 2, size / 2);

  ctx.restore();
}

const currentLineStyle: LineStyle = {
  width: 2,
  color: "#000000",
};

let currentSticker: string | null = null;
let stickerPreview: StickerPreview | null = null;
let stickerCommand: StickerCommand | null = null;
let isDrawing = false;
let currentColor: string = "#000000";
let currentRotation: number = 0;

const stickers: (Stickers | string)[] = [
  Stickers.Heart,
  Stickers.Star,
  Stickers.Smile,
];

const APP_NAME = "Jason's App";
const app = document.querySelector<HTMLDivElement>("#app")!;

const header = document.createElement("h1");
header.textContent = APP_NAME;
app.appendChild(header);

const canvas = document.getElementById("JasonsCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

function createButton(
  text: string,
  onClick: () => void,
  tooltip: string
): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", onClick);
  button.title = tooltip;
  app.appendChild(button);
  return button;
}

const thinButton = createButton(
  "Thin Brush",
  () => {
    currentLineStyle.width = 2;
    currentSticker = null;
    clearSelectedTool();
    thinButton.classList.add("selectedTool");
  },
  "Use a thin brush for drawing"
);

const thickButton = createButton(
  "Thick Brush",
  () => {
    currentLineStyle.width = 6;
    currentSticker = null;
    clearSelectedTool();
    thickButton.classList.add("selectedTool");
  },
  "Use a thick brush for drawing"
);

const redButton = createButton(
  "Red Brush",
  () => {
    currentLineStyle.color = "#ff0000";
    currentSticker = null;
    clearSelectedTool();
    redButton.classList.add("selectedTool");
  },
  "Use a red brush for drawing"
);

const blueButton = createButton(
  "Blue Brush",
  () => {
    currentLineStyle.color = "#0000ff";
    currentSticker = null;
    clearSelectedTool();
    blueButton.classList.add("selectedTool");
  },
  "Use a blue brush for drawing"
);

function createStickerButtons() {
  const stickerContainer = document.createElement("div");
  stickerContainer.id = "sticker-container";
  app.appendChild(stickerContainer);

  stickerContainer.innerHTML = "";

  stickers.forEach((sticker) => {
    const stickerButton = document.createElement("button");
    stickerButton.textContent = sticker;
    stickerButton.addEventListener("click", () => {
      currentSticker = sticker;
      dispatchToolMoved();
    });
    stickerButton.title = `Use the ${sticker} sticker`;
    stickerContainer.appendChild(stickerButton);
  });
}

const _customStickerButton = createButton(
  "Custom Emoji",
  () => {
    const customSticker = prompt("Enter your custom emoji or text", "🌟");
    if (customSticker) {
      stickers.push(customSticker);
      createStickerButtons();
    }
  },
  "Add a custom emoji or text"
);

createStickerButtons();

function clearSelectedTool() {
  const toolButtons = document.querySelectorAll("button");
  toolButtons.forEach((button) => button.classList.remove("selectedTool"));
}

function dispatchToolMoved() {
  const event = new CustomEvent("tool-moved");
  canvas.dispatchEvent(event);
}

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomRotation() {
  return Math.floor(Math.random() * 360);
}

const toolPreview = document.createElement("div");
toolPreview.style.width = "50px";
toolPreview.style.height = "50px";
toolPreview.style.border = "1px solid black";
app.appendChild(toolPreview);

const _markerButton = createButton(
  "Marker",
  () => {
    currentColor = getRandomColor();
    toolPreview.style.backgroundColor = currentColor;
  },
  "Use a random color marker"
);

const _stickerButton = createButton(
  "Sticker",
  () => {
    currentRotation = getRandomRotation();
    toolPreview.style.transform = `rotate(${currentRotation}deg)`;
  },
  "Use a random rotation sticker"
);

let paths: (MarkerLine | StickerCommand)[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: (MarkerLine | StickerCommand)[] = [];

function redraw() {
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  for (const path of paths) {
    if (path instanceof StickerCommand) {
      if (ctx) {
        drawSticker(ctx, path.x, path.y, 48, path.rotation, path.sticker);
      }
    } else {
      if (ctx) {
        path.display(ctx);
      }
    }
  }

  if (stickerPreview && !isDrawing && ctx) {
    stickerPreview.draw(ctx);
  }

  if (currentLine) {
    if (ctx) {
      currentLine.display(ctx);
    }
  }

  if (stickerCommand) {
    if (ctx) {
      stickerCommand.display(ctx);
    }
  }
}

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (!isDrawing && currentSticker) {
    if (!stickerPreview) {
      stickerPreview = new StickerPreview(e.offsetX, e.offsetY, currentSticker);
    }
    stickerPreview.update(e.offsetX, e.offsetY);
    redraw();
  }
});

canvas.addEventListener("mousedown", (e: MouseEvent) => {
  if (currentSticker) {
    stickerCommand = new StickerCommand(e.offsetX, e.offsetY, currentSticker);
    stickerPreview = null;
    redoStack = [];
  } else {
    isDrawing = true;
    currentLine = new MarkerLine(
      e.offsetX,
      e.offsetY,
      currentLineStyle.width,
      currentLineStyle.color
    );
  }
});

canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (isDrawing && currentLine) {
    currentLine.drag(e.offsetX, e.offsetY);
    redraw();
  } else if (stickerCommand) {
    stickerCommand.drag(e.offsetX, e.offsetY);
    redraw();
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (isDrawing && currentLine) {
    isDrawing = false;
    paths.push(currentLine);
    currentLine = null;
  } else if (stickerCommand) {
    stickerCommand.rotation = currentRotation;
    stickerCommand.x = event.offsetX;
    stickerCommand.y = event.offsetY;
    paths.push(stickerCommand);
    stickerCommand = null;
  }
  redraw();
});

const _undoButton = createButton(
  "Undo",
  () => {
    if (paths.length > 0) {
      const lastPath = paths.pop();
      redoStack.push(lastPath!);
      redraw();
    }
  },
  "Undo the last action"
);
// push
const _redoButton = createButton(
  "Redo",
  () => {
    if (redoStack.length > 0) {
      const pathToRedo = redoStack.pop();
      paths.push(pathToRedo!);
      redraw();
    }
  },
  "Redo the last undone action"
);

const _clearButton = createButton(
  "Clear Canvas",
  () => {
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    paths = [];
    redoStack = [];
    currentLine = null;
    redraw();
  },
  "Clear the entire canvas"
);

const _exportButton = createButton(
  "Export Canvas",
  () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 800;
    exportCanvas.height = 800;
    const exportCtx = exportCanvas.getContext("2d");

    exportCtx!.scale(4, 4);

    for (const path of paths) {
      path.display(exportCtx!);
    }

    const dataURL = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "canvas.png";
    link.click();
  },
  "Export the canvas as an image"
);

app.appendChild(header);
document.title = APP_NAME;

// Modal for initial instructions
const modal = document.createElement("div");
modal.style.position = "fixed";
modal.style.top = "0";
modal.style.left = "0";
modal.style.width = "100%";
modal.style.height = "100%";
modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
modal.style.display = "flex";
modal.style.justifyContent = "center";
modal.style.alignItems = "center";
modal.style.zIndex = "1000";

const modalContent = document.createElement("div");
modalContent.style.backgroundColor = "black";
modalContent.style.padding = "20px";
modalContent.style.borderRadius = "10px";
modalContent.style.textAlign = "center";

const modalText = document.createElement("p");
modalText.textContent =
  "Welcome to Jason's App! Here are the available tools:\n\n" +
  "1. Thin Brush: Use a thin brush for drawing.\n" +
  "2. Thick Brush: Use a thick brush for drawing.\n" +
  "3. Red Brush: Use a red brush for drawing.\n" +
  "4. Blue Brush: Use a blue brush for drawing.\n" +
  "5. Custom Emoji: Add a custom emoji or text.\n" +
  "6. Marker: Use a random color marker.\n" +
  "7. Sticker: Use a random rotation sticker.\n" +
  "8. Undo: Undo the last action.\n" +
  "9. Redo: Redo the last undone action.\n" +
  "10. Clear Canvas: Clear the entire canvas.\n" +
  "11. Export Canvas: Export the canvas as an image.";

const closeButton = document.createElement("button");
closeButton.textContent = "Close";
closeButton.addEventListener("click", () => {
  modal.style.display = "none";
});

modalContent.appendChild(modalText);
modalContent.appendChild(closeButton);
modal.appendChild(modalContent);
document.body.appendChild(modal);

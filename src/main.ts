import "./style.css";

class MarkerLine {
    private points: Array<{ x: number, y: number }> = [];
    private lineWidth: number;
    private lineColor: string;

    constructor(initialX: number, initialY: number, lineWidth: number, lineColor: string) {
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

// New StickerPreview class for previewing sticker placement
class StickerPreview {
    private x: number;
    private y: number;
    private sticker: string;

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
        ctx.font = "40px Arial";
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

// StickerCommand class for placing and dragging stickers
class StickerCommand {
    private x: number;
    private y: number;
    private sticker: string;

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
        ctx.font = "40px Arial";
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

// Default style for the marker
let currentLineStyle = {
    width: 2,
    color: "#000000"
};

let currentSticker: string | null = null;
let stickerPreview: StickerPreview | null = null;
let stickerCommand: StickerCommand | null = null;
let isDrawing = false;

// Set up the app and canvas
const APP_NAME = "Jason's App";
const app = document.querySelector<HTMLDivElement>("#app")!;

// Create and append an h1 element with the app name
const header = document.createElement("h1");
header.textContent = APP_NAME;
app.appendChild(header);

// Get the canvas from the DOM
const canvas = document.getElementById('JasonsCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

// Create buttons for line width and color
const thinButton = document.createElement("button");
thinButton.textContent = "Thin Marker";
app.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Marker";
app.appendChild(thickButton);

const redButton = document.createElement("button");
redButton.textContent = "Red Marker";
app.appendChild(redButton);

const blueButton = document.createElement("button");
blueButton.textContent = "Blue Marker";
app.appendChild(blueButton);

// Create buttons for stickers (emoji strings)
const heartButton = document.createElement("button");
heartButton.textContent = "❤️";
app.appendChild(heartButton);

const starButton = document.createElement("button");
starButton.textContent = "⭐";
app.appendChild(starButton);

const smileyButton = document.createElement("button");
smileyButton.textContent = "😊";
app.appendChild(smileyButton);

// Event listeners for changing the line style
thinButton.addEventListener("click", () => {
    currentLineStyle.width = 2;
    clearSelectedTool();
    thinButton.classList.add("selectedTool");
});

thickButton.addEventListener("click", () => {
    currentLineStyle.width = 8;
    clearSelectedTool();
    thickButton.classList.add("selectedTool");
});

redButton.addEventListener("click", () => {
    currentLineStyle.color = "#ff0000";
    clearSelectedTool();
    redButton.classList.add("selectedTool");
});

blueButton.addEventListener("click", () => {
    currentLineStyle.color = "#0000ff";
    clearSelectedTool();
    blueButton.classList.add("selectedTool");
});

// Event listeners for selecting stickers
heartButton.addEventListener("click", () => {
    currentSticker = "❤️";
    dispatchToolMoved();
});

starButton.addEventListener("click", () => {
    currentSticker = "⭐";
    dispatchToolMoved();
});

smileyButton.addEventListener("click", () => {
    currentSticker = "😊";
    dispatchToolMoved();
});

// Function to clear the selected tool class from all buttons
function clearSelectedTool() {
    const toolButtons = document.querySelectorAll("button");
    toolButtons.forEach((button) => button.classList.remove("selectedTool"));
}

// Dispatch a custom "tool-moved" event
function dispatchToolMoved() {
    const event = new CustomEvent("tool-moved");
    canvas.dispatchEvent(event);
}

// Array to hold all drawing paths and stickers
let paths: (MarkerLine | StickerCommand)[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: (MarkerLine | StickerCommand)[] = [];

// Redraw all lines, stickers, and the tool preview
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const path of paths) {
        path.display(ctx);
    }

    if (stickerPreview && !isDrawing) {
        stickerPreview.draw(ctx);
    }

    if (currentLine) {
        currentLine.display(ctx);
    }

    if (stickerCommand) {
        stickerCommand.display(ctx);
    }
}

// Event listener for mouse movement to update the sticker preview
canvas.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isDrawing && currentSticker) {
        if (!stickerPreview) {
            stickerPreview = new StickerPreview(e.offsetX, e.offsetY, currentSticker);
        }
        stickerPreview.update(e.offsetX, e.offsetY);
        redraw();
    }
});

// Event listener for mouse down to start drawing or placing a sticker
canvas.addEventListener("mousedown", (e: MouseEvent) => {
    if (currentSticker) {
        stickerCommand = new StickerCommand(e.offsetX, e.offsetY, currentSticker);
        stickerPreview = null;
        redoStack = [];
    } else {
        isDrawing = true;
        currentLine = new MarkerLine(e.offsetX, e.offsetY, currentLineStyle.width, currentLineStyle.color);
    }
});

// Event listener for mouse move to track mouse positions while drawing or moving a sticker
canvas.addEventListener("mousemove", (e: MouseEvent) => {
    if (isDrawing && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        redraw();
    } else if (stickerCommand) {
        stickerCommand.drag(e.offsetX, e.offsetY);
        redraw();
    }
});

// Event listener for mouse up to stop drawing or finalize sticker placement
canvas.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        paths.push(currentLine);
        currentLine = null;
    } else if (stickerCommand) {
        paths.push(stickerCommand);
        stickerCommand = null;
    }
    redraw();
});

// Undo button functionality
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

undoButton.addEventListener("click", () => {
    if (paths.length > 0) {
        const lastPath = paths.pop();
        redoStack.push(lastPath!);
        redraw();
    }
});

// Redo button functionality
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const pathToRedo = redoStack.pop();
        paths.push(pathToRedo!);
        redraw();
    }
});

// Clear button functionality
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
app.appendChild(clearButton);

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
    redoStack = [];
    currentLine = null;
    redraw();
});

// Append the header to the app and set the document title
app.appendChild(header);
document.title = APP_NAME;

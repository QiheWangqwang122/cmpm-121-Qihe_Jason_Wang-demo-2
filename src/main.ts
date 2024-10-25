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

// New ToolPreview class to handle the tool preview rendering
class ToolPreview {
    private x: number;
    private y: number;
    private radius: number;
    private color: string;

    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    // Update position
    update(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Draw the preview (circle) at the current mouse position
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Default style for the marker
let currentLineStyle = {
    width: 2,
    color: "#000000"
};

let toolPreview: ToolPreview | null = null; // To hold the preview tool object
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

// Function to clear the selected tool class from all buttons
function clearSelectedTool() {
    const toolButtons = document.querySelectorAll("button");
    toolButtons.forEach((button) => button.classList.remove("selectedTool"));
}

// Array to hold all drawing paths
let paths: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: MarkerLine[] = [];

// Function to dispatch a custom "drawing-changed" event
function dispatchDrawingChanged() {
    const event = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(event);
}

// Redraw all lines and the tool preview
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all saved lines
    for (const path of paths) {
        path.display(ctx);
    }

    // If the tool preview exists and the user isn't drawing, display it
    if (toolPreview && !isDrawing) {
        toolPreview.draw(ctx);
    }

    // Draw the current line being drawn
    if (currentLine) {
        currentLine.display(ctx);
    }
}

// Event listener for mouse movement to update the tool preview
canvas.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isDrawing) {
        // If toolPreview is null, create a new instance
        if (!toolPreview) {
            toolPreview = new ToolPreview(e.offsetX, e.offsetY, currentLineStyle.width / 2, currentLineStyle.color);
        }

        // Update the tool preview's position and size
        toolPreview.update(e.offsetX, e.offsetY);
        dispatchDrawingChanged();
    }

    // Custom event for "tool-moved"
    const toolMovedEvent = new CustomEvent("tool-moved", {
        detail: { x: e.offsetX, y: e.offsetY }
    });
    canvas.dispatchEvent(toolMovedEvent);
});

// Event listener for mouse down to start drawing
canvas.addEventListener("mousedown", (e: MouseEvent) => {
    isDrawing = true;
    currentLine = new MarkerLine(e.offsetX, e.offsetY, currentLineStyle.width, currentLineStyle.color);
    toolPreview = null;  // Hide the tool preview when drawing starts
    redoStack = [];
});

// Event listener for mouse move to track mouse positions while drawing
canvas.addEventListener("mousemove", (e: MouseEvent) => {
    if (isDrawing && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        redraw();
    }
});

// Event listener for mouse up to stop drawing
canvas.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        paths.push(currentLine);
        currentLine = null;
        dispatchDrawingChanged();
    }
});

// Redraw when "drawing-changed" is dispatched
canvas.addEventListener("drawing-changed", () => {
    redraw();
});

// Clear button functionality to reset the canvas and paths
const clearButton = document.createElement("button");
clearButton.textContent = "Clear Canvas";
app.appendChild(clearButton);

clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
    redoStack = [];
    currentLine = null;
    dispatchDrawingChanged();
});

// Undo button functionality
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

undoButton.addEventListener("click", () => {
    if (paths.length > 0) {
        const lastPath = paths.pop();
        redoStack.push(lastPath!);
        dispatchDrawingChanged();
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
        dispatchDrawingChanged();
    }
});

// Append the header to the app and set the document title
app.appendChild(header);
document.title = APP_NAME;

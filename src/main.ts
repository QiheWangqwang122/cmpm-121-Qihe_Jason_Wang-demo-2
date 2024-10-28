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

// StickerPreview class for previewing sticker placement
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
        ctx.font = "48px Arial"; // Adjusted size
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

// StickerCommand class for placing and dragging stickers
class StickerCommand {
    private x: number;
    private y: number;
    private sticker: string;
    public rotation: number = 0; // Added rotation property

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
        ctx.save(); // Save the current state
        ctx.translate(this.x, this.y); // Translate to the sticker position
        ctx.rotate(this.rotation * Math.PI / 180); // Rotate the context
        ctx.font = "48px Arial"; // Adjusted size
        ctx.fillText(this.sticker, 0, 0); // Draw the sticker at the origin
        ctx.restore(); // Restore the original state
    }
}

// Function to draw a sticker with a visual indicator
function drawSticker(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, emoji: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.font = `${size}px serif`;
    ctx.fillText(emoji, -size / 2, size / 2);

    // Draw a visual indicator (small arrow)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size / 2);
    ctx.lineTo(-5, -size / 2 + 10);
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(5, -size / 2 + 10);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
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
let currentColor: string = "#000000"; // Added currentColor
let currentRotation: number = 0; // Added currentRotation

// Array to store the available stickers (initially predefined stickers)
let stickers = ["❤️", "⭐", "😊"];

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
thinButton.textContent = "Thin Brush"; // Renamed
app.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick Brush"; // Renamed
app.appendChild(thickButton);

const redButton = document.createElement("button");
redButton.textContent = "Red Brush"; // Renamed
app.appendChild(redButton);

const blueButton = document.createElement("button");
blueButton.textContent = "Blue Brush"; // Renamed
app.appendChild(blueButton);

// Function to dynamically create sticker buttons based on the stickers array
function createStickerButtons() {
    const stickerContainer = document.createElement("div");
    stickerContainer.id = "sticker-container";
    app.appendChild(stickerContainer);
    
    // Clear old buttons first
    stickerContainer.innerHTML = "";

    stickers.forEach((sticker) => {
        const stickerButton = document.createElement("button");
        stickerButton.textContent = sticker;
        stickerButton.addEventListener("click", () => {
            currentSticker = sticker;
            dispatchToolMoved();
        });
        stickerContainer.appendChild(stickerButton);
    });
}

// Create a custom sticker button
const customStickerButton = document.createElement("button");
customStickerButton.textContent = "Custom Emoji"; // Renamed
app.appendChild(customStickerButton);

// Event listener for creating a custom sticker
customStickerButton.addEventListener("click", () => {
    const customSticker = prompt("Enter your custom emoji or text", "🌟"); // Renamed
    if (customSticker) {
        stickers.push(customSticker);  // Add the custom sticker to the array
        createStickerButtons();  // Recreate the buttons to include the new custom sticker
    }
});

// Initial creation of sticker buttons
createStickerButtons();

// Event listeners for changing the line style
thinButton.addEventListener("click", () => {
    currentLineStyle.width = 2; // Adjusted thickness
    currentSticker = null; // Clear current sticker
    clearSelectedTool();
    thinButton.classList.add("selectedTool");
});

thickButton.addEventListener("click", () => {
    currentLineStyle.width = 6; // Adjusted thickness
    currentSticker = null; // Clear current sticker
    clearSelectedTool();
    thickButton.classList.add("selectedTool");
});

redButton.addEventListener("click", () => {
    currentLineStyle.color = "#ff0000";
    currentSticker = null; // Clear current sticker
    clearSelectedTool();
    redButton.classList.add("selectedTool");
});

blueButton.addEventListener("click", () => {
    currentLineStyle.color = "#0000ff";
    currentSticker = null; // Clear current sticker
    clearSelectedTool();
    blueButton.classList.add("selectedTool");
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

// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to generate a random rotation angle
function getRandomRotation() {
    return Math.floor(Math.random() * 360);
}

// Tool preview element
const toolPreview = document.createElement("div");
toolPreview.style.width = "50px";
toolPreview.style.height = "50px";
toolPreview.style.border = "1px solid black";
app.appendChild(toolPreview);

// Marker button functionality
const markerButton = document.createElement("button");
markerButton.textContent = "Marker";
app.appendChild(markerButton);

markerButton.addEventListener("click", () => {
    currentColor = getRandomColor();
    toolPreview.style.backgroundColor = currentColor;
});

// Sticker button functionality
const stickerButton = document.createElement("button");
stickerButton.textContent = "Sticker";
app.appendChild(stickerButton);

stickerButton.addEventListener("click", () => {
    currentRotation = getRandomRotation();
    toolPreview.style.transform = `rotate(${currentRotation}deg)`;
});

// Array to hold all drawing paths and stickers
let paths: (MarkerLine | StickerCommand)[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: (MarkerLine | StickerCommand)[] = [];

// Redraw all lines, stickers, and the tool preview
function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const path of paths) {
        if (path instanceof StickerCommand) {
            drawSticker(ctx, path.x, path.y, 48, path.rotation, path.sticker);
        } else {
            path.display(ctx);
        }
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
canvas.addEventListener("mouseup", (event) => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        paths.push(currentLine);
        currentLine = null;
    } else if (stickerCommand) {
        stickerCommand.rotation = currentRotation; // Apply rotation to sticker
        stickerCommand.x = event.offsetX;
        stickerCommand.y = event.offsetY;
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

// Export button functionality
const exportButton = document.createElement("button");
exportButton.textContent = "Export Canvas";
app.appendChild(exportButton);

exportButton.addEventListener("click", () => {
    // Create a new canvas of size 800x800
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 800; // Adjusted size
    exportCanvas.height = 800; // Adjusted size
    const exportCtx = exportCanvas.getContext("2d");

    // Scale the context to fit the larger canvas
    exportCtx!.scale(4, 4);

    // Execute all the items on the display list against the new canvas
    for (const path of paths) {
        path.display(exportCtx!);
    }

    // Trigger a file download with the contents of the new canvas as a PNG file
    const dataURL = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "canvas.png";
    link.click();
});

// Append the header to the app and set the document title
app.appendChild(header);
document.title = APP_NAME;
import "./style.css";

class MarkerLine {
    private points: Array<{ x: number, y: number }> = [];  // To store the line's points

    constructor(initialX: number, initialY: number) {
        this.points.push({ x: initialX, y: initialY });
    }

    // Method to add new points as the user drags
    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    // Method to draw the line on the canvas
    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length < 2) return;  // Not enough points to draw

        ctx.beginPath();
        for (let i = 0; i < this.points.length - 1; i++) {
            ctx.moveTo(this.points[i].x, this.points[i].y);
            ctx.lineTo(this.points[i + 1].x, this.points[i + 1].y);
        }
        ctx.stroke();
    }
}

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

// Array to hold all drawing paths (each path is a MarkerLine object)
let paths: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;

// Stack for redo functionality
let redoStack: MarkerLine[] = [];

// Ensure the canvas exists and the context is valid
if (!canvas || !ctx) {
    console.error("Failed to get canvas or context.");
} else {
    let isDrawing = false;

    // Function to dispatch the custom "drawing-changed" event
    function dispatchDrawingChanged() {
        const event = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(event);
    }

    // Redraw all paths stored in the paths array and the current line
    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the entire canvas

        // Redraw all MarkerLine objects
        for (const path of paths) {
            path.display(ctx);  // Each MarkerLine object knows how to draw itself
        }

        // Draw the current line being drawn (if any)
        if (currentLine) {
            currentLine.display(ctx);
        }
    }

    // Event listener for mouse down to start drawing
    canvas.addEventListener("mousedown", (e: MouseEvent) => {
        isDrawing = true;
        currentLine = new MarkerLine(e.offsetX, e.offsetY);  // Create a new MarkerLine
        redoStack = [];  // Clear the redo stack when starting a new drawing
    });

    // Event listener for mouse move to track mouse positions
    canvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (isDrawing && currentLine) {
            currentLine.drag(e.offsetX, e.offsetY);  // Extend the current MarkerLine
            redraw();  // Redraw the canvas
        }
    });

    // Event listener for mouse up to finish the current line
    canvas.addEventListener("mouseup", () => {
        if (isDrawing && currentLine) {
            isDrawing = false;
            paths.push(currentLine);  // Save the current MarkerLine into paths array
            currentLine = null;  // Reset currentLine
            dispatchDrawingChanged();  // Dispatch the event once the path is completed
        }
    });

    // Event listener for mouse leave to stop drawing when the cursor leaves the canvas
    canvas.addEventListener("mouseleave", () => {
        if (isDrawing && currentLine) {
            isDrawing = false;
            paths.push(currentLine);  // Save the current path
            currentLine = null;
            dispatchDrawingChanged();  // Dispatch the event
        }
    });

    // Event handler for "drawing-changed" to clear and redraw the canvas
    canvas.addEventListener("drawing-changed", () => {
        redraw();  // Redraw whenever a drawing event occurs
    });

    // Clear button functionality to reset the canvas and paths
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear Canvas";
    app.appendChild(clearButton);

    clearButton.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clears the entire canvas
        paths = [];  // Clears the saved paths
        redoStack = [];  // Clears the redo stack
        currentLine = null;  // Also clear the current line
        dispatchDrawingChanged();  // Dispatch the event after clearing the canvas
    });

    // Undo button functionality
    const undoButton = document.createElement("button");
    undoButton.textContent = "Undo";
    app.appendChild(undoButton);

    undoButton.addEventListener("click", () => {
        if (paths.length > 0) {
            const lastPath = paths.pop();  // Remove the last path
            redoStack.push(lastPath!);  // Add it to the redo stack
            dispatchDrawingChanged();  // Dispatch the event to update the drawing
        }
    });

    // Redo button functionality
    const redoButton = document.createElement("button");
    redoButton.textContent = "Redo";
    app.appendChild(redoButton);

    redoButton.addEventListener("click", () => {
        if (redoStack.length > 0) {
            const pathToRedo = redoStack.pop();  // Get the last undone path
            paths.push(pathToRedo!);  // Add it back to the paths array
            dispatchDrawingChanged();  // Dispatch the event to update the drawing
        }
    });
}

// Append the header to the app and set the document title
app.appendChild(header);
document.title = APP_NAME;

import "./style.css";

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

// Array to hold all drawing paths (each path is an array of points)
let paths: Array<Array<{ x: number, y: number }>> = [];
let currentPath: Array<{ x: number, y: number }> = [];

let redoStack: Array<Array<{ x: number, y: number }>> = [];

if (!canvas || !ctx) {
    console.error("Failed to get canvas or context.");
} else {
    let isDrawing = false;

    // Function to dispatch the custom "drawing-changed" event
    function dispatchDrawingChanged() {
        const event = new CustomEvent("drawing-changed");
        canvas.dispatchEvent(event);
    }

    // Redraw all paths stored in the paths array and current path
    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the entire canvas

        // Redraw all paths stored in the paths array
        for (const path of paths) {
            ctx.beginPath();
            for (let i = 0; i < path.length - 1; i++) {
                ctx.moveTo(path[i].x, path[i].y);
                ctx.lineTo(path[i + 1].x, path[i + 1].y);
            }
            ctx.stroke();
        }

        // Draw the current path being drawn
        if (currentPath.length > 0) {
            ctx.beginPath();
            for (let i = 0; i < currentPath.length - 1; i++) {
                ctx.moveTo(currentPath[i].x, currentPath[i].y);
                ctx.lineTo(currentPath[i + 1].x, currentPath[i + 1].y);
            }
            ctx.stroke();
        }
    }

    // Event listener for mouse down to start drawing
    canvas.addEventListener("mousedown", (e: MouseEvent) => {
        isDrawing = true;
        currentPath = [];  // Start a new path
        currentPath.push({ x: e.offsetX, y: e.offsetY });  // Save the starting point
        redoStack = [];  // Clear the redo stack when starting a new drawing
    });

    // Event listener for mouse move to track mouse positions
    canvas.addEventListener("mousemove", (e: MouseEvent) => {
        if (isDrawing) {
            currentPath.push({ x: e.offsetX, y: e.offsetY });  // Save each point
            redraw();  // Redraw as the user draws
        }
    });

    // Event listener for mouse up to finish the current path
    canvas.addEventListener("mouseup", () => {
        if (isDrawing) {
            isDrawing = false;
            paths.push([...currentPath]);  // Save the current path into paths array
            currentPath = [];  // Clear the current path to avoid redrawing it
            dispatchDrawingChanged();  // Dispatch the event once the path is completed
        }
    });

    // Event listener for mouse leave to stop drawing when the cursor leaves the canvas
    canvas.addEventListener("mouseleave", () => {
        if (isDrawing) {
            isDrawing = false;
            paths.push([...currentPath]);  // Save the current path
            currentPath = [];  // Clear the current path
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
        currentPath = [];  // Also clear the current path
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

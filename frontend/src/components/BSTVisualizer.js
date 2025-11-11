import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Search, Trash2 } from 'lucide-react';

// --- Constants ---
const NODE_RADIUS = 25;
const VERTICAL_SPACING = 70;
const HORIZONTAL_SPACING_UNIT = 30; // Base unit for horizontal separation
const SVG_HEIGHT = 600;
const INITIAL_SPEED = 500; // ms

// --- API Endpoint (Updated to live Render URL) ---
const API_URL = 'https://algo-visualizer-api-ry07.onrender.com/api/bst'; 

// --- Helper Component: Renders an individual node and its line to the parent ---
const BSTNode = ({ node, x, y, parentX, parentY, highlight, action, path }) => {
    if (!node) return null;

    // Determine color based on highlight status and action
    let circleColor = 'fill-gray-600';
    let textColor = 'fill-white';
    let ringColor = 'ring-gray-300';

    if (highlight) {
        if (action === 'Inserted' || action === 'Root Inserted') {
            circleColor = 'fill-green-500';
            ringColor = 'ring-green-300';
        } else if (action === 'Target Found' || action === 'Value Deleted') { // Added 'Value Deleted' highlight
            circleColor = 'fill-indigo-500';
            ringColor = 'ring-indigo-300';
        } else if (action === 'Move Left' || action === 'Move Right' || action === 'Visiting') {
            circleColor = 'fill-yellow-500';
            ringColor = 'ring-yellow-300';
        } else if (action === 'Value Not Found' || action === 'Value Already Exists (Skipping)') {
            circleColor = 'fill-red-500';
            ringColor = 'ring-red-300';
        }
    } else if (path && path.includes(node.value)) {
         // Optionally highlight nodes that are part of the path, but not the current step
         circleColor = 'fill-blue-400';
         ringColor = 'ring-blue-300';
    }

    return (
        <g>
            {/* Line to Parent */}
            {(parentX !== undefined) && (
                <line 
                    x1={parentX} 
                    y1={parentY + NODE_RADIUS} 
                    x2={x} 
                    y2={y - NODE_RADIUS}
                    stroke="#4B5563" 
                    strokeWidth="2" 
                    markerEnd="url(#arrowhead)"
                />
            )}

            {/* Node Circle */}
            <circle 
                cx={x} 
                cy={y} 
                r={NODE_RADIUS} 
                className={`${circleColor} transition-all duration-500 ease-in-out stroke-2 ${ringColor}`}
                strokeWidth="4"
            />

            {/* Node Value Text */}
            <text 
                x={x} 
                y={y + 5} 
                textAnchor="middle" 
                className={`${textColor} font-bold text-lg pointer-events-none`}
            >
                {node.value}
            </text>
        </g>
    );
};

// --- Main Component ---
export default function App() {
    const [treeState, setTreeState] = useState(null); // JSON object from backend
    const [inputValue, setInputValue] = useState(50);
    const [steps, setSteps] = useState([]); // Array of visualization steps
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(INITIAL_SPEED); // ms per step
    const [message, setMessage] = useState('Enter a value to insert into the BST.');
    const [isLoading, setIsLoading] = useState(false); // Loading state for API calls

    const timerRef = useRef(null);

    // --- State and Visualization Management ---

    // Effect to handle automatic step playback
    useEffect(() => {
        if (isPlaying && currentStepIndex < steps.length - 1) {
            timerRef.current = setInterval(() => {
                setCurrentStepIndex(prevIndex => prevIndex + 1);
            }, speed);
        } else if (isPlaying && currentStepIndex === steps.length - 1) {
            // Stop when the last step is reached
            setIsPlaying(false);
            if (steps.length > 0) {
                 const finalStep = steps[steps.length - 1];
                 const finalAction = finalStep.action;
                 
                 // Update the tree state based on the final step's resulting tree
                 if (finalStep.final_tree) {
                    setTreeState(finalStep.final_tree);
                 }

                 if (finalAction.includes('Inserted') || finalAction.includes('Found') || finalAction.includes('Deleted')) {
                    setMessage(`Operation complete: ${finalAction}. Tree is stable.`);
                 } else {
                    setMessage('Operation completed.');
                 }
            } else {
                 setMessage('Operation completed.');
            }
        } else if (!isPlaying && timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPlaying, currentStepIndex, steps.length, speed, steps]); // Added steps as dependency for final_tree logic

    const resetVisualization = () => {
        setIsPlaying(false);
        setCurrentStepIndex(-1);
        setSteps([]);
        setMessage('Visualization ready. Insert, search, or delete a value.');
    };

    const handleSpeedChange = (increment) => {
        setSpeed(prev => {
            const newSpeed = prev + increment;
            if (newSpeed < 100) return 100;
            if (newSpeed > 2000) return 2000;
            return newSpeed;
        });
    };

    // --- API and Operation Logic ---

    const handleOperation = async (operation) => {
        resetVisualization(); // Clear old steps before starting new operation
        const valueInt = parseInt(inputValue);

        if (isLoading) return; // Prevent multiple API calls

        if (isNaN(valueInt) || valueInt < 1 || valueInt > 999) {
            setMessage('Please enter a valid number between 1 and 999.');
            return;
        }

        setMessage(`Performing ${operation} of value ${valueInt}...`);
        setIsLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: operation,
                    value: valueInt,
                    // CRITICAL: Send current state with the snake_case key
                    tree_state: treeState, 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const newSteps = result.steps || [];
            
            // NOTE: We rely on the animation loop's final step to update the state (final_tree)
            // but we use the immediate new_tree_state_dict if no steps were generated (e.g., failed insert/delete)
            const newState = result.new_tree_state_dict || null; 
            
            setSteps(newSteps);
            
            if (newSteps.length > 0) {
                setCurrentStepIndex(0); // Start visualization
                setIsPlaying(true);
            } else {
                // If no steps, immediately update tree (e.g., failed to insert duplicate, or root was deleted)
                setTreeState(newState);
                setMessage(result.message || 'No steps generated for this operation.');
            }

        } catch (error) {
            console.error('Error during BST operation:', error);
            setMessage(`Error: ${error.message}. Check your backend server is running and accessible at ${API_URL}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Add Search Operation
    const handleSearch = () => {
        handleOperation('search');
    }

    // --- Tree Drawing Logic (Layout Calculation) ---

    const drawTree = (root) => {
        if (!root) return { nodes: [], svgWidth: 0 };

        let nodes = [];
        // Start minX and maxX at the center to ensure even a single node provides a decent viewbox
        let minX = 0; 
        let maxX = 0;

        // Recursive function to calculate node positions
        const calculatePosition = (node, depth, xOffset, parentX, parentY) => {
            if (!node) return 0; // Return width of null subtree

            // The multiplier for horizontal spacing should be depth-dependent to prevent overlap
            // We use a power of 2 approach for spacing unit growth
            const spacing = HORIZONTAL_SPACING_UNIT * Math.pow(1.5, depth);

            // Calculate width of the left subtree
            const leftWidth = calculatePosition(node.left, depth + 1, xOffset, parentX, parentY);
            
            // Calculate current node's X position
            // Center is based on left subtree's end point + current node's slot (1 unit)
            const currentX = xOffset + leftWidth * spacing; 
            const currentY = depth * VERTICAL_SPACING + NODE_RADIUS * 2;
            
            // Track min/max X for SVG width calculation
            minX = Math.min(minX, currentX);
            maxX = Math.max(maxX, currentX);

            // Add the current node to the list
            nodes.push({
                ...node,
                x: currentX,
                y: currentY,
                parentX: parentX,
                parentY: parentY,
                id: node.value, // Use value as key for simplicity
            });

            // Calculate width of the right subtree
            // Right offset starts immediately after the current node's position + padding
            const rightOffset = currentX / spacing + 1; // Used as the new starting position (relative index)
            const rightWidth = calculatePosition(node.right, depth + 1, xOffset + (leftWidth + 1) * spacing, currentX, currentY);

            // Return the total width used by this subtree (left + self + right)
            return leftWidth + 1 + rightWidth;
        };

        // Start calculation. Use a large starting space (300) to ensure nodes aren't negative initially.
        const totalWidthUnits = calculatePosition(root, 0, 300, undefined, undefined); 

        // Center the tree horizontally and translate coordinates to the final SVG positions
        const totalCalculatedWidth = maxX - minX;
        const centerOffset = 40; // Initial padding for the SVG viewbox
        // Ensure minimum width of 800 and scale based on max calculated width
        const viewBoxWidth = Math.max(800, totalCalculatedWidth + 2 * centerOffset);
        
        // Translate all nodes to be centered in the viewbox (Shift everything to the right by centerOffset)
        const shiftX = centerOffset;

        nodes = nodes.map(node => ({
            ...node,
            x: node.x + shiftX,
            parentX: node.parentX !== undefined ? node.parentX + shiftX : undefined,
        }));
        
        return { nodes, svgWidth: viewBoxWidth };
    };

    const { nodes, svgWidth } = drawTree(treeState);
    const currentStep = steps[currentStepIndex];

    const handleClearTree = () => {
        setTreeState(null);
        resetVisualization();
        setMessage('Tree cleared. Start inserting new values!');
    }


    // --- Render Logic ---

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans p-4">
            <header className="text-center py-6 bg-white shadow-md rounded-lg mb-6">
                <h1 className="text-4xl font-extrabold text-gray-800">Binary Search Tree Visualizer</h1>
                <p className="text-gray-500 mt-2">See how BST operations work step-by-step using a Python backend.</p>
            </header>

            {/* Controls */}
            <div className="bg-white p-6 shadow-xl rounded-xl border border-gray-200 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Input and Operation Buttons */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-700 shadow-sm"
                            placeholder="Value"
                            min="1" max="999"
                            disabled={isPlaying || isLoading}
                        />
                        <button 
                            onClick={() => handleOperation('insert')} 
                            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50"
                            title="Insert Value"
                            disabled={isPlaying || isLoading}
                        >
                            <Plus size={20} className="mr-1" /> Insert
                        </button>
                        <button 
                            onClick={handleSearch} 
                            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50"
                            title="Search Value"
                            disabled={isPlaying || isLoading}
                        >
                            <Search size={20} className="mr-1" /> Search
                        </button>
                        <button 
                            onClick={() => handleOperation('delete')} 
                            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-300 transform hover:scale-105 disabled:opacity-50"
                            title="Delete Value"
                            disabled={isPlaying || isLoading}
                        >
                            <Trash2 size={20} className="mr-1" /> Delete
                        </button>
                    </div>

                    {/* Visualization Controls */}
                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <span className="text-gray-600 font-medium">Speed ({speed}ms):</span>
                        <button 
                            onClick={() => handleSpeedChange(100)} 
                            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition duration-150"
                            title="Slow Down"
                            disabled={isPlaying || isLoading}
                        >
                            <Plus size={16} />
                        </button>
                        <button 
                            onClick={() => handleSpeedChange(-100)} 
                            className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition duration-150"
                            title="Speed Up"
                            disabled={isPlaying || isLoading}
                        >
                            <Minus size={16} />
                        </button>

                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            disabled={steps.length === 0 || isLoading}
                            className={`p-2 rounded-full shadow-lg transition duration-300 ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        
                        <button 
                            onClick={handleClearTree}
                            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg transition duration-300 disabled:opacity-50"
                            title="Clear Tree"
                            disabled={isPlaying || isLoading}
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Status Message / Loading Indicator */}
            <div className="mb-6 p-4 text-center bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded-lg shadow-inner">
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-semibold">Processing...</span>
                    </div>
                ) : (
                    <>
                        <span className="font-semibold">Status: </span>
                        {message}
                        {currentStep && (
                            <span className="ml-4 font-bold text-lg">
                                Step {currentStepIndex + 1}/{steps.length}: {currentStep.action}
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* Visualization Canvas */}
            <div className="flex-grow bg-white shadow-xl rounded-xl overflow-x-auto border border-gray-200 relative">
                <svg 
                    viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`} 
                    width="100%" 
                    height={SVG_HEIGHT} 
                    className="p-4"
                >
                    {/* Define Arrowhead Marker */}
                    <defs>
                        <marker 
                            id="arrowhead" 
                            markerWidth="10" 
                            markerHeight="7" 
                            refX="10" // Adjusted refX to be slightly past the circle center
                            refY="3.5" 
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
                        </marker>
                    </defs>

                    {nodes.map(node => (
                        <BSTNode
                            key={node.id}
                            node={node}
                            x={node.x}
                            y={node.y}
                            parentX={node.parentX}
                            parentY={node.parentY}
                            // Highlight the current node being processed
                            highlight={currentStep && currentStep.value === node.value}
                            action={currentStep ? currentStep.action : ''}
                            path={currentStep ? currentStep.path : []}
                        />
                    ))}
                </svg>
                {treeState === null && !isLoading && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-gray-400">
                        <Plus size={48} className="mx-auto" />
                        <p className="mt-2 text-xl font-medium">Tree is empty. Insert a value to begin.</p>
                    </div>
                )}
            </div>
            
             {/* Footer - Display Tree State for Debugging */}
            <footer className="mt-4 p-4 text-xs text-gray-500 text-center bg-white rounded-lg shadow-sm overflow-x-auto">
                <h3 className="font-bold text-gray-700">Current Tree State (JSON):</h3>
                <pre className="whitespace-pre-wrap break-all text-left mt-2">
                    {JSON.stringify(treeState, null, 2)}
                </pre>
            </footer>
        </div>
    );
}
import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- API Configuration (Added) ---
const RENDER_API_BASE_URL = "https://algo-visualizer-api-ry07.onrender.com";
// ---------------------------------

// --- Components ---

/**
 * ArrayBar Component: Displays a single element in the array visualization.
 * It handles color coding based on the algorithm state.
 */
const ArrayBar = React.memo(({ value, height, width, isHighlighted, isPivot, isSorted, isSearchMid, isSearchRange, isFound, isLinearCheck, isBinarySearchMode, isLinearSearchMode }) => {
    
    // Default color is Blue - using inline styles instead of Tailwind
    let backgroundColor = '#3b82f6'; // blue-500
    let opacity = 1;

    // --- Search Mode Logic ---
    if (isFound) {
        // Found element (Both Search Algorithms) takes highest priority
        backgroundColor = '#10b981'; // emerald-500
    } else if (isLinearCheck) {
        // Linear Search Specific Color for current comparison
        backgroundColor = '#ef4444'; // red-500
    } else if (isSearchMid) {
        // Mid element (Binary Search)
        backgroundColor = '#f59e0b'; // amber-500
    } else if (isSearchRange) {
        // Elements in the current search range (Binary Search)
        backgroundColor = '#60a5fa'; // blue-400
    } else if (isBinarySearchMode) { 
        // Excluded elements during Binary Search
        opacity = 0.3;
        backgroundColor = '#9ca3af'; // gray-400
    }
    
    // --- Sorting Mode Logic (Applied if not in active search highlight) ---
    // Corrected the check here by ensuring isLinearSearchMode is available as a prop
    if (!isBinarySearchMode && !isLinearSearchMode) { // Ensure sorting colors only apply if not in a search mode
        if (isSorted) {
            backgroundColor = '#22c55e'; // green-500
            opacity = 1;
        } else if (isPivot) {
            backgroundColor = '#9333ea'; // purple-600
        } else if (isHighlighted) {
            backgroundColor = '#f97316'; // orange-500
        }
    }

    const finalWidth = width > 0 ? `${width}px` : '20px';

    return (
        <div 
            style={{
                height: `${height}px`,
                width: finalWidth,
                minWidth: finalWidth,
                minHeight: '20px',
                margin: '0 1px',
                backgroundColor: backgroundColor,
                opacity: opacity,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: width > 20 ? '10px' : '8px',
                borderRadius: '4px 4px 0 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                position: 'relative',
                flexShrink: 0,
                // Maintained transition for smoother visual steps
                transition: 'height 0.2s ease-out, background-color 0.1s linear', 
            }}
            title={`Value: ${value}`}
        >
            {/* Show value for bars wide enough */}
            {width > 20 && value}
        </div>
    );
});

// --- Constants ---
const DEFAULT_ARRAY_SIZE = 15;
const MAX_ARRAY_VALUE = 400; 
const MIN_ARRAY_VALUE = 10;
const ANIMATION_SPEED_MS = 100; 

// --- Algorithm Pseudocode ---
const PSEUDOCODE = {
    bubblesort: [
        "function bubbleSort(array):",
        "  n = array.length",
        "  for i from 0 to n - 2:",
        "    for j from 0 to n - 2 - i:",
        "      // Compare & Highlight array[j] and array[j+1]",
        "      if array[j] > array[j+1]:",
        "        // Swap elements",
        "        swap(array[j], array[j+1])",
        "  return array"
    ],
    mergesort: [
        "function mergeSort(array):",
        "  if array.length <= 1: return array",
        "  mid = floor(array.length / 2)",
        "  left = mergeSort(array[0...mid])",
        "  right = mergeSort(array[mid...n])",
        "  return merge(left, right)",
        "",
        "function merge(left, right):",
        "  // Merging sub-arrays and placing back into the original array...",
        "  result = []",
        "  while left & right are not empty:",
        "    if left[0] <= right[0]:",
        "      result.push(left.shift())",
        "    else:",
        "      result.push(right.shift())",
        "  return result + left + right"
    ],
    quicksort: [
        "function quickSort(array, low, high):",
        "  if low < high:",
        "    // Partition the array",
        "    pi = partition(array, low, high)",
        "    // Recursively sort left and right sub-arrays",
        "    quickSort(array, low, pi - 1)",
        "    quickSort(array, pi + 1, high)",
        "",
        "function partition(array, low, high):",
        "  pivot = array[high] // Choose the last element as pivot",
        "  i = low - 1",
        "  for j from low to high - 1:",
        "    if array[j] < pivot:",
        "      i++",
        "      swap(array[i], array[j])",
        "  swap(array[i+1], array[high])",
        "  return i + 1"
    ],
    shellsort: [
        "function shellSort(array):",
        "  n = array.length",
        "  gap = floor(n / 2)",
        "  while gap > 0:",
        "    // Perform gapped insertion sort",
        "    for i from gap to n - 1:",
        "      temp = array[i]",
        "      j = i",
        "      while j >= gap and array[j - gap] > temp:",
        "        // Shift elements (Highlight comparison and shift)",
        "        array[j] = array[j - gap]",
        "        j = j - gap",
        "      // Place temp (Highlight placement)",
        "      array[j] = temp",
        "    gap = floor(gap / 2) // Reduce the gap"
    ],
    selectionsort: [
        "function selectionSort(array):",
        "  n = array.length",
        "  for i from 0 to n - 2:",
        "    // Assume current position i holds the minimum",
        "    minIndex = i",
        "    for j from i + 1 to n - 1:",
        "      // Highlight comparison between array[j] and array[minIndex]",
        "      if array[j] < array[minIndex]:",
        "        // Update the index of the minimum element",
        "        minIndex = j",
        "    // If a smaller element was found, swap it into position i",
        "    if minIndex is not i:",
        "      swap(array[i], array[minIndex])",
        "    // Position i is finalized",
        "  return array"
    ],
    binarysearch: [
        "function binarySearch(array, target):",
        "  // Array MUST be sorted",
        "  low = 0",
        "  high = array.length - 1",
        "  while low <= high:",
        "    mid = floor((low + high) / 2)",
        "    // Highlight mid element (array[mid])",
        "    if array[mid] == target:",
        "      return mid",
        "    else if array[mid] < target:",
        "      // Search right (New Low = mid + 1)",
        "      low = mid + 1",
        "      // Exclude left half",
        "    else:",
        "      // Search left (New High = mid - 1)",
        "      high = mid - 1",
        "      // Exclude right half",
        "  return -1"
    ],
    linearsearch: [
        "function linearSearch(array, target):",
        "  n = array.length",
        "  for i from 0 to n - 1:",
        "    // Highlight array[i]",
        "    if array[i] == target:",
        "      return i",
        "  return -1"
    ],
    bstinsert: [
        "function insert(node, value):",
        "  if node is null:",
        "    return new Node(value)",
        "  if value < node.value:",
        "    node.left = insert(node.left, value)",
        "  else if value > node.value:",
        "    node.right = insert(node.right, value)",
        "  return node"
    ],
    bstsearch: [
        "function search(node, value):",
        "  if node is null or node.value == value:",
        "    return node",
        "  if value < node.value:",
        "    return search(node.left, value)",
        "  else:",
        "    return search(node.right, value)"
    ],
};

// --- Helper Functions (No changes needed to core logic, keeping them concise) ---

const generateRandomArray = (size) => {
    return Array.from({ length: size }, () => 
        Math.floor(Math.random() * (MAX_ARRAY_VALUE - MIN_ARRAY_VALUE + 1)) + MIN_ARRAY_VALUE
    );
};

const parseCustomArray = (inputString) => {
    const elements = inputString.split(',')
        .map(s => {
            const num = parseInt(s.trim());
            return isNaN(num) || num <= 0 ? null : Math.min(num, MAX_ARRAY_VALUE);
        })
        .filter(n => n !== null);
    return elements;
};

// --- CLIENT-SIDE ALGORITHM LOGIC (Generators for visualization steps) ---

const getBubbleSortSteps = (initialArray) => { 
    let array = [...initialArray];
    const steps = [];
    const n = array.length;
    let sortedIndices = [];

    const recordStep = (action, highlight_indices = [], newArray = null, sorted_indices = []) => {
        steps.push({
            array: newArray ? [...newArray] : [...array],
            highlight_indices: highlight_indices,
            action: action,
            sorted_indices: [...sorted_indices]
        });
        if (newArray) array = newArray;
    };

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - 1 - i; j++) {
            
            recordStep(`Comparing array[${j}] and array[${j + 1}]`, [j, j + 1], null, sortedIndices);

            if (array[j] > array[j + 1]) {
                const tempArray = [...array];
                [tempArray[j], tempArray[j + 1]] = [tempArray[j + 1], tempArray[j]];
                swapped = true;
                
                recordStep(`Swapping ${array[j]} and ${array[j+1]}`, [j, j + 1], tempArray, sortedIndices);
            }
            
            recordStep(`Comparison done. Resetting comparison highlights.`, [], null, sortedIndices);
        }
        
        const sortedIndex = n - 1 - i;
        sortedIndices.push(sortedIndex);
        recordStep(`Position ${sortedIndex} is finalized (Sorted).`, [sortedIndex], null, sortedIndices);


        if (!swapped) {
            for (let k = 0; k < n - 1 - i; k++) {
                if (!sortedIndices.includes(k)) {
                     sortedIndices.push(k);
                }
            }
            break;
        }
    }
    
    if (n > 0 && !sortedIndices.includes(0)) {
        sortedIndices.push(0);
        recordStep(`Final element at index 0 is sorted.`, [0], null, sortedIndices);
    }


    const finalSortedIndices = Array.from({ length: n }, (_, i) => i);
    recordStep("Finished Bubble Sort", [], null, finalSortedIndices);

    return steps;
};


const getMergeSortSteps = (initialArray) => { 
    let array = [...initialArray];
    const steps = [];
    
    const recordStep = (action, highlight_indices = [], newArray = null, sorted_indices = []) => {
        steps.push({
            array: newArray ? [...newArray] : [...array],
            highlight_indices: highlight_indices,
            action: action,
            sorted_indices: [...sorted_indices]
        });
        if (newArray) array = newArray;
    };

    const merge = (arr, start, mid, end) => {
        const left = arr.slice(start, mid);
        const right = arr.slice(mid, end);
        let i = 0, j = 0, k = start;
        
        recordStep(`Preparing to merge elements from index ${start} to ${end - 1}`, Array.from({ length: end - start }, (_, idx) => start + idx));

        let currentWorkingArray = [...array];

        while (i < left.length && j < right.length) {
            
            recordStep(`Comparing ${left[i]} and ${right[j]}`, [start + i, mid + j]);
            
            if (left[i] <= right[j]) {
                currentWorkingArray[k] = left[i];
                i++;
            } else {
                currentWorkingArray[k] = right[j];
                j++;
            }
            
            recordStep(`Placing element ${currentWorkingArray[k]} at index ${k}`, [k], currentWorkingArray);
            k++;
        }

        while (i < left.length) {
            currentWorkingArray[k] = left[i];
            recordStep(`Placing remaining element ${currentWorkingArray[k]} from left half at ${k}`, [k], currentWorkingArray);
            i++; k++;
        }
        while (j < right.length) {
            currentWorkingArray[k] = right[j];
            recordStep(`Placing remaining element ${currentWorkingArray[k]} from right half at ${k}`, [k], currentWorkingArray);
            j++; k++;
        }
        
        recordStep(`Merged segment complete from index ${start} to ${end - 1}`, Array.from({ length: end - start }, (_, idx) => start + idx));
    };

    const mergeSortHelper = (arr, start, end) => {
        if (end - start <= 1) return;
        
        recordStep(`Splitting array segment from ${start} to ${end - 1}`, Array.from({ length: end - start }, (_, idx) => start + idx));

        const mid = Math.floor((start + end) / 2);
        mergeSortHelper(arr, start, mid);
        mergeSortHelper(arr, mid, end);
        merge(arr, start, mid, end);
    };

    mergeSortHelper(array, 0, array.length);

    const finalSortedIndices = Array.from({ length: array.length }, (_, i) => i);
    recordStep("Finished Merge Sort", [], null, finalSortedIndices);
    
    return steps;
};

const getQuickSortSteps = (initialArray) => { 
    let array = [...initialArray];
    const steps = [];

    const recordStep = (action, highlight_indices = [], pivot_index = null, newArray = null, sorted_indices = []) => {
        steps.push({
            array: newArray ? [...newArray] : [...array],
            action: action,
            highlight_indices: highlight_indices,
            pivot_index: pivot_index,
            sorted_indices: [...sorted_indices]
        });
        if (newArray) array = newArray;
    };

    const sortedIndicesTracker = [];

    const partition = (arr, low, high) => {
        let tempArray = [...arr];
        const pivot = tempArray[high]; 
        let i = low - 1; 

        recordStep(`Selecting pivot ${pivot} at index ${high}`, [], high, null, sortedIndicesTracker);

        for (let j = low; j <= high - 1; j++) {
            
            recordStep(`Comparing ${tempArray[j]} at ${j} with pivot ${pivot}`, [j], high, null, sortedIndicesTracker);
            
            if (tempArray[j] < pivot) {
                i++;
                [tempArray[i], tempArray[j]] = [tempArray[j], tempArray[i]];
                
                recordStep(`Swapping ${tempArray[j]} and ${tempArray[i]} to move small element left`, [i, j], high, tempArray, sortedIndicesTracker);
            }
            
            recordStep(`Resetting comparison highlights`, [], high, null, sortedIndicesTracker);
        }

        const pivotIndex = i + 1;
        [tempArray[pivotIndex], tempArray[high]] = [tempArray[high], tempArray[pivotIndex]];
        
        recordStep(`Pivot ${pivot} placed correctly at index ${pivotIndex}`, [pivotIndex], null, tempArray, [...sortedIndicesTracker, pivotIndex]);

        return pivotIndex;
    };

    const quickSortHelper = (arr, low, high) => {
        if (low < high) {
            const pi = partition(arr, low, high);

            if (!sortedIndicesTracker.includes(pi)) {
                sortedIndicesTracker.push(pi);
            }

            quickSortHelper(arr, low, pi - 1);
            quickSortHelper(arr, pi + 1, high);
        } else if (low === high && low >= 0) {
            if (!sortedIndicesTracker.includes(low)) {
                sortedIndicesTracker.push(low);
                recordStep(`Sub-array of size 1 at index ${low} is sorted.`, [], null, null, sortedIndicesTracker);
            }
        }
    };

    quickSortHelper(array, 0, array.length - 1);

    const finalSortedIndices = Array.from({ length: array.length }, (_, i) => i);
    steps.push({
        array: [...array], 
        action: "Finished Quick Sort",
        highlight_indices: [],
        pivot_index: null,
        sorted_indices: finalSortedIndices
    });

    return steps;
};

const getShellSortSteps = (initialArray) => { 
    let array = [...initialArray];
    const steps = [];
    const n = array.length;
    let gap = Math.floor(n / 2);
    let sortedIndices = [];

    const recordStep = (action, highlight_indices = [], current_gap = gap, newArray = null, sorted_indices = []) => {
        steps.push({
            array: newArray ? [...newArray] : [...array],
            action: action,
            highlight_indices: highlight_indices,
            gap: current_gap,
            sorted_indices: [...sorted_indices]
        });
        if (newArray) array = newArray;
    };

    while (gap > 0) {
        recordStep(`Starting pass with Gap = ${gap}`, [], gap, null, sortedIndices);

        for (let i = gap; i < n; i++) {
            let tempArray = [...array];
            const temp = tempArray[i];
            let j = i;

            recordStep(`Selecting element ${temp} at index ${i}. Gap = ${gap}`, [i], gap, null, sortedIndices);

            while (j >= gap && tempArray[j - gap] > temp) {
                
                recordStep(`Comparing ${tempArray[j - gap]} at ${j - gap} and selected element ${temp}. Gap = ${gap}`, [j, j - gap], gap, null, sortedIndices);
                
                tempArray[j] = tempArray[j - gap];
                
                recordStep(`Shifting ${tempArray[j - gap]} to ${j}. Gap = ${gap}`, [j], gap, tempArray, sortedIndices);
                
                j -= gap;
                
                recordStep(`Resetting highlights. Gap = ${gap}`, [], gap, null, sortedIndices);
            }
            
            tempArray[j] = temp;
            
            recordStep(`Placing ${temp} at index ${j}. Gap = ${gap}`, [j], gap, tempArray, sortedIndices);
        }

        gap = Math.floor(gap / 2);
    }
    
    const finalSortedIndices = Array.from({ length: n }, (_, i) => i);
    recordStep("Finished Shell Sort", [], 0, null, finalSortedIndices);

    return steps;
};

const getSelectionSortSteps = (initialArray) => { 
    let array = [...initialArray];
    const steps = [];
    const n = array.length;
    let sortedIndices = [];

    const recordStep = (action, highlight_indices = [], min_index = null, newArray = null, sorted_indices = []) => {
        steps.push({
            array: newArray ? [...newArray] : [...array],
            action: action,
            highlight_indices: highlight_indices,
            pivot_index: min_index, // Using pivot_index to track current minimum
            sorted_indices: [...sorted_indices]
        });
        if (newArray) array = newArray;
    };

    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;
        let tempArray = [...array];
        
        recordStep(`Starting pass ${i + 1}. Current index is ${i}.`, [i], minIndex, null, sortedIndices);

        for (let j = i + 1; j < n; j++) {
            
            recordStep(`Comparing ${tempArray[j]} at ${j} with current minimum ${tempArray[minIndex]} at ${minIndex}.`, [j], minIndex, null, sortedIndices);

            if (tempArray[j] < tempArray[minIndex]) {
                minIndex = j;
                recordStep(`New minimum found: ${tempArray[minIndex]} at index ${minIndex}.`, [j], minIndex, null, sortedIndices);
            }
            
            recordStep(`Comparison done.`, [], minIndex, null, sortedIndices);
        }

        if (minIndex !== i) {
            [tempArray[i], tempArray[minIndex]] = [tempArray[minIndex], tempArray[i]];
            recordStep(`Swapping ${tempArray[minIndex]} (current position) with ${tempArray[i]} (new smallest) to place smallest element at ${i}.`, [i, minIndex], null, tempArray, sortedIndices);
        } else {
             recordStep(`Element at ${i} is already the smallest in the unsorted portion.`, [i], null, null, sortedIndices);
        }
        
        sortedIndices.push(i);
        recordStep(`Position ${i} is finalized (Sorted).`, [], null, null, sortedIndices);
    }
    
    if (n > 0 && !sortedIndices.includes(n - 1)) {
        sortedIndices.push(n - 1);
        recordStep(`Final element at index ${n-1} is sorted.`, [], null, null, sortedIndices);
    }

    const finalSortedIndices = Array.from({ length: n }, (_, k) => k);
    recordStep("Finished Selection Sort", [], null, null, finalSortedIndices);

    return steps;
};


const getBinarySearchSteps = (arr, target) => { 
    const steps = [];
    const array = [...arr];

    steps.push({
        array: [...array],
        action: `Search started for target ${target}. Array must be sorted.`,
        low: 0,
        high: array.length - 1,
        mid: -1,
        found: false,
        search_target: target,
        highlight_indices: [],
        isSearch: true,
    });

    let low = 0;
    let high = array.length - 1;
    let found = false;
    let mid = -1;

    while (low <= high) {
        mid = Math.floor((low + high) / 2);

        steps.push({
            array: [...array],
            action: `Checking mid element at index ${mid}: Value is ${array[mid]}`,
            low: low,
            high: high,
            mid: mid,
            found: false,
            search_target: target,
            highlight_indices: [mid],
            isSearch: true,
        });

        if (array[mid] === target) {
            found = true;
            break;
        } else if (array[mid] < target) {
            low = mid + 1;
            steps.push({
                array: [...array],
                action: `Target (${target}) is greater than ${array[mid]}. Searching right half (New Low: ${low}).`,
                low: low,
                high: high,
                mid: mid,
                found: false,
                search_target: target,
                highlight_indices: [],
                isSearch: true,
            });
        } else {
            high = mid - 1;
            steps.push({
                array: [...array],
                action: `Target (${target}) is less than ${array[mid]}. Searching left half (New High: ${high}).`,
                low: low,
                high: high,
                mid: mid,
                found: false,
                search_target: target,
                highlight_indices: [],
                isSearch: true,
            });
        }
    }

    if (found) {
        steps.push({
            array: [...array],
            action: `SUCCESS! Target ${target} found at index ${mid}. Search complete.`,
            low: low,
            high: high,
            mid: mid,
            found: true,
            search_target: target,
            highlight_indices: [mid],
            isSearch: true,
        });
    } else {
        steps.push({
            array: [...array],
            action: `FAILURE! Target ${target} not found. Low (${low}) > High (${high}).`,
            low: low,
            high: high,
            mid: -1,
            found: false,
            search_target: target,
            highlight_indices: [],
            isSearch: true,
        });
    }

    return steps;
};

const getLinearSearchSteps = (arr, target) => { 
    const steps = [];
    const array = [...arr];
    const n = array.length;
    let found = false;
    let foundIndex = -1;

    steps.push({
        array: [...array],
        action: `Linear Search started for target ${target}.`,
        current_index: -1,
        found: false,
        search_target: target,
        highlight_indices: [],
        isLinearSearch: true,
    });

    for (let i = 0; i < n; i++) {
        
        steps.push({
            array: [...array],
            action: `Comparing element at index ${i}: Value is ${array[i]}`,
            current_index: i,
            found: false,
            search_target: target,
            highlight_indices: [i],
            isLinearSearch: true,
        });
        
        if (array[i] === target) {
            found = true;
            foundIndex = i;
            break;
        }

        steps.push({
            array: [...array],
            action: `Value ${array[i]} does not match ${target}. Moving to next index.`,
            current_index: i,
            found: false,
            search_target: target,
            highlight_indices: [], 
            isLinearSearch: true,
        });
    }

    if (found) {
        steps.push({
            array: [...array],
            action: `SUCCESS! Target ${target} found at index ${foundIndex}. Search complete.`,
            current_index: foundIndex,
            found: true,
            search_target: target,
            highlight_indices: [foundIndex],
            isLinearSearch: true,
        });
    } else {
        steps.push({
            array: [...array],
            action: `FAILURE! Target ${target} not found after checking all elements. Search complete.`,
            current_index: n - 1,
            found: false,
            search_target: target,
            highlight_indices: [],
            isLinearSearch: true,
        });
    }

    return steps;
};


// --- BST Placeholder Component ---

/**
 * BSTVisualizer Component (Placeholder for complex BST logic)
 * This component handles all BST operations and rendering.
 */
const BSTVisualizer = ({ speed, isAnimating, handleStartStopAnimation, selectedAlgorithm }) => {
    // NOTE: In a real app, this component would contain all the state,
    // tree structure, insertion/search logic, and SVG rendering.
    
    // For this example, we'll just show the controls and a placeholder view.
    const [bstElements, setBstElements] = useState([15, 6, 23, 4, 7, 71]);
    const [inputValue, setInputValue] = useState(10);
    const [bstSteps, setBstSteps] = useState(null);
    const [bstStepIndex, setBstStepIndex] = useState(0);

    const isBstAnimationComplete = bstSteps && bstStepIndex >= bstSteps.length - 1 && bstSteps.length > 0; 
    
    // Placeholder logic for BST operation (Insert/Search)
    const handleOperation = (operation) => {
        // In a full implementation, this would trigger the actual BST operation
        // and generate steps for the animation.
        console.log(`Executing BST ${operation} with value: ${inputValue}`);
        
        // --- Placeholder Step Generation ---
        const newSteps = [{
            action: `Simulating ${operation} for value ${inputValue}...`,
            code_line: 1
        }, {
            action: `${operation} complete!`,
            code_line: 7
        }];
        setBstSteps(newSteps);
        setBstStepIndex(0);
        handleStartStopAnimation();
    };

    const currentBstStep = bstSteps ? bstSteps[bstStepIndex] : null;

    useEffect(() => {
        if (!isAnimating || !bstSteps || bstSteps.length === 0 || bstStepIndex >= bstSteps.length - 1) {
            return;
        }

        const timer = setTimeout(() => {
            setBstStepIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
    }, [isAnimating, bstSteps, bstStepIndex, speed]);

    const currentPseudocode = PSEUDOCODE[selectedAlgorithm];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">BST Operations</h3>
                
                {/* Current Elements */}
                <p className="text-sm font-medium text-gray-500">
                    Current Elements: <span className="text-indigo-600 font-mono">{bstElements.join(', ')}</span>
                </p>

                {/* Input and Buttons */}
                <div className="flex flex-col space-y-2">
                    <input
                        type="number"
                        placeholder="Value to Insert/Search"
                        value={inputValue}
                        onChange={(e) => setInputValue(Number(e.target.value))}
                        className="p-2 border border-gray-300 rounded-lg"
                        disabled={isAnimating}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleOperation('insert')}
                            className="flex-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition disabled:opacity-50"
                            disabled={isAnimating || !inputValue}
                        >
                            Insert
                        </button>
                        <button
                            onClick={() => handleOperation('search')}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition disabled:opacity-50"
                            disabled={isAnimating || !inputValue}
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Playback Controls */}
                 <div className="flex justify-center items-center space-x-2 border-t pt-4 mt-4">
                    <button onClick={() => setBstStepIndex(0)} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || bstStepIndex === 0}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m4 14l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => setBstStepIndex(prev => Math.max(0, prev - 1))} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || bstStepIndex === 0}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    <button
                        onClick={handleStartStopAnimation}
                        className={`p-3 rounded-full shadow-lg transform transition disabled:opacity-50 ${isAnimating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                        disabled={!bstSteps || bstSteps.length === 0}
                    >
                        {isAnimating ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </button>

                    <button onClick={() => setBstStepIndex(prev => Math.min(bstSteps.length - 1, prev + 1))} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || isBstAnimationComplete}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <button onClick={() => setBstStepIndex(bstSteps.length - 1)} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || isBstAnimationComplete}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {/* Pseudocode & Status */}
            <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Binary Search Tree (BST) Visualization</h3>
                
                {/* Visualization Area (Placeholder) */}
                <div className="w-full min-h-[300px] bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 font-medium">
                    {/* In a complete app, this would be an SVG rendering of the tree */}
                    Tree Structure Visualization (SVG) Placeholder
                </div>
                
                {/* Current Action/Step Status */}
                <div className="p-3 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-200">
                    <span className="font-semibold">Status:</span> {currentBstStep ? currentBstStep.action : "Waiting for operation..."}
                </div>

                {/* Pseudocode */}
                <div className="bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-auto max-h-[250px] shadow-lg">
                    <p className="text-gray-400 mb-2 border-b border-gray-700 pb-1 font-sans font-bold text-base">
                        Pseudocode: {selectedAlgorithm.toUpperCase()}
                    </p>
                    {currentPseudocode.map((line, index) => (
                        <pre 
                            key={index} 
                            className={`whitespace-pre-wrap transition-colors duration-150 ${
                                currentBstStep && currentBstStep.code_line === index + 1
                                    ? 'bg-yellow-600 text-gray-900 font-bold px-1 rounded -mx-1'
                                    : 'text-gray-200'
                            }`}
                        >
                            <span className="text-gray-500 mr-2">{index + 1}.</span>
                            {line}
                        </pre>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

const App = () => {
    // --- State Variables ---
    const [array, setArray] = useState(generateRandomArray(DEFAULT_ARRAY_SIZE));
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('bubblesort');
    const [animationSteps, setAnimationSteps] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState(ANIMATION_SPEED_MS);
    const [arraySize, setArraySize] = useState(DEFAULT_ARRAY_SIZE);
    const [customArrayInput, setCustomArrayInput] = useState('');
    const [targetValue, setTargetValue] = useState(250);
    
    // Visualization Area Dimensions for responsive array bar widths
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const isSearchAlgorithm = ['binarysearch', 'linearsearch'].includes(selectedAlgorithm);
    const isBSTAlgorithm = ['bstinsert', 'bstsearch'].includes(selectedAlgorithm);
    const isAnimationComplete = animationSteps && stepIndex >= animationSteps.length - 1 && animationSteps.length > 0;
    
    // --- Responsive width calculation ---
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, [arraySize]);
    
    // Calculate bar width dynamically
    const barWidth = containerWidth > 0 ? (containerWidth / array.length) - 2 : 20;


    // --- Core Logic ---

    // 1. Array Generation/Reset
    const handleGenerateNewArray = useCallback((size = arraySize, input = '') => {
        setIsAnimating(false);
        setStepIndex(0);
        setAnimationSteps(null);

        let newArray;
        if (input) {
            newArray = parseCustomArray(input);
        } else {
            newArray = generateRandomArray(size);
        }
        
        if (newArray.length === 0) {
            alert("Invalid array input. Please check format.");
            return;
        }

        if (isSearchAlgorithm) {
            // Searches need a sorted array for visualization
            newArray.sort((a, b) => a - b); 
        }

        setArray(newArray);
    }, [arraySize, isSearchAlgorithm]);

    useEffect(() => {
        handleGenerateNewArray(DEFAULT_ARRAY_SIZE);
    }, [handleGenerateNewArray]);


    // 2. Algorithm Execution and Step Generation
    const handleExecuteAlgorithm = useCallback(() => {
        setIsAnimating(false);
        setStepIndex(0);

        let steps = [];
        const currentArray = [...array]; 

        switch (selectedAlgorithm) {
            case 'bubblesort':
                steps = getBubbleSortSteps(currentArray);
                break;
            case 'mergesort':
                steps = getMergeSortSteps(currentArray);
                break;
            case 'quicksort':
                steps = getQuickSortSteps(currentArray);
                break;
            case 'shellsort':
                steps = getShellSortSteps(currentArray);
                break;
            case 'selectionsort':
                steps = getSelectionSortSteps(currentArray);
                break;
            case 'binarysearch':
                // Binary search requires a sorted array
                currentArray.sort((a, b) => a - b);
                setArray(currentArray);
                steps = getBinarySearchSteps(currentArray, targetValue);
                break;
            case 'linearsearch':
                steps = getLinearSearchSteps(currentArray, targetValue);
                break;
            default:
                console.error("Unknown algorithm selected");
                return;
        }

        if (steps.length > 0) {
            setAnimationSteps(steps);
            setIsAnimating(true);
        }

    }, [array, selectedAlgorithm, targetValue]);


    // 3. Animation Control (useEffect for stepping)
    useEffect(() => {
        if (!isAnimating || !animationSteps || animationSteps.length === 0 || stepIndex >= animationSteps.length - 1) {
            setIsAnimating(false);
            return;
        }

        const timer = setTimeout(() => {
            setStepIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
    }, [isAnimating, animationSteps, stepIndex, speed]);


    // 4. Playback Handlers
    const handleStartStopAnimation = () => {
        if (animationSteps === null) {
            handleExecuteAlgorithm();
        } else {
            setIsAnimating(prev => !prev);
        }
    };

    const handleNextStep = () => {
        if (stepIndex < animationSteps.length - 1) {
            setStepIndex(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        if (stepIndex > 0) {
            setStepIndex(prev => prev - 1);
            setIsAnimating(false); // Stop animation when manually stepping back
        }
    };
    
    // 5. Array/Target Change Handlers
    const handleArraySizeChange = (e) => {
        const newSize = Number(e.target.value);
        if (newSize >= 5 && newSize <= 50) {
            setArraySize(newSize);
            handleGenerateNewArray(newSize);
        }
    };

    const handleCustomArraySubmit = () => {
        const newArray = parseCustomArray(customArrayInput);
        if (newArray.length > 0) {
             setArraySize(newArray.length);
             handleGenerateNewArray(newArray.length, customArrayInput);
        } else {
             // Replacing window.alert() with a UI message or console log
             console.error("Invalid custom array provided.");
        }
    };

    // 6. Visualization Data (Based on current step)
    const currentStep = animationSteps ? animationSteps[stepIndex] : null;
    const currentArray = currentStep ? currentStep.array : array;
    const highlightIndices = currentStep ? (currentStep.highlight_indices || []) : [];
    const pivotIndex = currentStep ? (currentStep.pivot_index !== undefined ? currentStep.pivot_index : null) : null;
    const sortedIndices = currentStep ? (currentStep.sorted_indices || []) : [];
    const currentAction = currentStep ? currentStep.action : 'Ready to start.';
    const currentLow = currentStep && currentStep.low !== undefined ? currentStep.low : null;
    const currentHigh = currentStep && currentStep.high !== undefined ? currentStep.high : null;
    const currentMid = currentStep && currentStep.mid !== undefined ? currentStep.mid : null;
    const isFound = currentStep ? currentStep.found : false;
    const isBinarySearchMode = selectedAlgorithm === 'binarysearch';
    const isLinearSearchMode = selectedAlgorithm === 'linearsearch';


    // 7. Render Logic
    if (isBSTAlgorithm) {
        // Render the separate BST visualizer component
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-indigo-700">Algorithm Visualizer</h1>
                    <p className="text-gray-500">Binary Search Tree Operations</p>
                </header>
                <BSTVisualizer 
                    speed={speed} 
                    isAnimating={isAnimating} 
                    handleStartStopAnimation={handleStartStopAnimation} 
                    selectedAlgorithm={selectedAlgorithm}
                />
            </div>
        );
    }
    
    // Standard Array Visualization Layout
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-indigo-700">Algorithm Visualizer</h1>
                <p className="text-gray-500 text-lg">See {selectedAlgorithm.toUpperCase().replace('SEARCH', ' Search')} in Action</p>
            </header>

            {/* --- Main Control Panel --- */}
            <div className="bg-white shadow-xl rounded-xl p-6 mb-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    
                    {/* Algorithm Selector */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm</label>
                        <select
                            value={selectedAlgorithm}
                            onChange={(e) => {
                                setSelectedAlgorithm(e.target.value);
                                handleGenerateNewArray(); // Reset array for new algorithm
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="bubblesort">Bubble Sort</option>
                            <option value="selectionsort">Selection Sort</option>
                            <option value="mergesort">Merge Sort</option>
                            <option value="quicksort">Quick Sort</option>
                            <option value="shellsort">Shell Sort</option>
                            <option disabled>--- Search Algorithms ---</option>
                            <option value="linearsearch">Linear Search</option>
                            <option value="binarysearch">Binary Search</option>
                            <option disabled>--- Tree Algorithms ---</option>
                            <option value="bstinsert">BST Insert (WIP)</option>
                            <option value="bstsearch">BST Search (WIP)</option>
                        </select>
                    </div>

                    {/* Array Size / Target Value Input */}
                    {isSearchAlgorithm ? (
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Value (Max {MAX_ARRAY_VALUE})</label>
                            <input
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                min={MIN_ARRAY_VALUE}
                                max={MAX_ARRAY_VALUE}
                            />
                        </div>
                    ) : (
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Array Size (5-50)</label>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                value={arraySize}
                                onChange={handleArraySizeChange}
                                className="w-full h-8 appearance-none bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                            />
                            <p className="text-center text-xs text-gray-500 mt-1">Current Size: {arraySize}</p>
                        </div>
                    )}
                    

                    {/* Animation Speed */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animation Speed ({speed}ms)</label>
                        <input
                            type="range"
                            min="10"
                            max="500"
                            value={speed}
                            onChange={(e) => setSpeed(Number(e.target.value))}
                            className="w-full h-8 appearance-none bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="col-span-1 flex space-x-2">
                        <button
                            onClick={() => handleGenerateNewArray()}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition disabled:opacity-50"
                            disabled={isAnimating}
                        >
                            Reset Array
                        </button>
                        <button
                            onClick={handleExecuteAlgorithm}
                            className={`flex-1 px-4 py-2 text-white font-bold rounded-lg shadow-md transition disabled:opacity-50 ${isAnimationComplete ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            disabled={isAnimating && animationSteps !== null}
                        >
                            {isAnimationComplete ? 'Re-Run' : (animationSteps === null ? 'Run' : 'Restart')}
                        </button>
                    </div>

                    {/* Custom Array Input */}
                    <div className="col-span-4 md:col-span-2 lg:col-span-2 flex space-x-2 items-end">
                         <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Array (comma-separated, e.g., 5,350,120)</label>
                            <input
                                type="text"
                                placeholder="e.g., 50, 100, 20"
                                value={customArrayInput}
                                onChange={(e) => setCustomArrayInput(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isAnimating}
                            />
                         </div>
                        <button
                            onClick={handleCustomArraySubmit}
                            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50"
                            disabled={isAnimating || !customArrayInput}
                        >
                            Set
                        </button>
                    </div>

                </div>
            </div>

            {/* --- Visualization Area and Pseudocode --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Visualization Container */}
                <div className="lg:col-span-2 bg-white shadow-xl rounded-xl p-6 border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Data Visualization</h2>

                    {/* Array Bars */}
                    <div ref={containerRef} className="flex items-end justify-center w-full min-h-[450px] max-h-[450px] overflow-x-auto overflow-y-hidden bg-gray-100 p-2 rounded-lg relative">
                        {currentArray.map((value, index) => (
                            <ArrayBar
                                key={index}
                                value={value}
                                height={value}
                                width={barWidth}
                                isHighlighted={highlightIndices.includes(index) && !isSearchAlgorithm}
                                isPivot={pivotIndex === index}
                                isSorted={sortedIndices.includes(index) || isAnimationComplete}
                                
                                // Search Specific Props
                                isBinarySearchMode={isBinarySearchMode}
                                isLinearSearchMode={isLinearSearchMode}
                                isFound={isFound && (isBinarySearchMode ? currentMid === index : currentStep.current_index === index)}
                                isLinearCheck={isLinearSearchMode && highlightIndices.includes(index)}
                                isSearchMid={isBinarySearchMode && currentMid === index}
                                // Highlight elements within the low-high range for Binary Search
                                isSearchRange={isBinarySearchMode && currentLow !== null && currentHigh !== null && index >= currentLow && index <= currentHigh && index !== currentMid}
                            />
                        ))}
                        
                        {/* Binary Search Range Indicators */}
                        {isBinarySearchMode && currentLow !== null && currentHigh !== null && (
                            <>
                                {/* Low Pointer */}
                                <div style={{left: `${currentLow * (barWidth + 2) + barWidth/2 + 10}px`}} className="absolute bottom-[-20px] transform -translate-x-1/2 text-sm font-bold text-blue-600 transition-all duration-300">
                                    LOW ({currentLow})
                                </div>
                                {/* High Pointer */}
                                <div style={{left: `${currentHigh * (barWidth + 2) + barWidth/2 + 10}px`}} className="absolute bottom-[-20px] transform -translate-x-1/2 text-sm font-bold text-red-600 transition-all duration-300">
                                    HIGH ({currentHigh})
                                </div>
                            </>
                        )}
                    </div>

                    {/* Current Action / Status Bar */}
                    <div className="mt-4 p-3 bg-indigo-100 text-indigo-800 text-sm rounded-lg border border-indigo-300 font-medium">
                        <span className="font-bold">Current Action (Step {stepIndex + 1}/{animationSteps ? animationSteps.length : 1}):</span> {currentAction}
                    </div>

                    {/* Playback Controls */}
                    <div className="flex justify-center items-center space-x-2 border-t pt-4 mt-4">
                        <button onClick={() => setStepIndex(0)} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || stepIndex === 0}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m4 14l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={handlePrevStep} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || stepIndex === 0}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>

                        <button
                            onClick={handleStartStopAnimation}
                            className={`p-4 rounded-full shadow-xl transform transition disabled:opacity-50 ${isAnimating ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            disabled={isAnimationComplete && !isAnimating}
                        >
                            {isAnimating ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                        </button>

                        <button onClick={handleNextStep} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || isAnimationComplete}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <button onClick={() => setStepIndex(animationSteps.length - 1)} className="p-2 text-gray-600 hover:text-indigo-600 rounded-full transition disabled:opacity-50" disabled={isAnimating || isAnimationComplete}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                </div>

                {/* 2. Pseudocode Panel */}
                <div className="lg:col-span-1 bg-gray-800 shadow-xl rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Pseudocode</h2>
                    <div className="font-mono text-sm max-h-[600px] overflow-y-auto">
                        {(PSEUDOCODE[selectedAlgorithm] || ["// Pseudocode not found"]).map((line, index) => (
                            <pre 
                                key={index} 
                                className={`whitespace-pre-wrap transition-colors duration-150 py-0.5 rounded-sm ${
                                    currentStep && currentStep.code_line === index + 1 
                                        ? 'bg-yellow-600 text-gray-900 font-bold px-1 -mx-1'
                                        : 'text-gray-200'
                                }`}
                            >
                                <span className="text-gray-500 mr-2">{index + 1}.</span>
                                {line}
                            </pre>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-gray-700">
                         <h3 className="text-sm font-bold text-white mb-2">Color Legend</h3>
                         <div className="space-y-1 text-xs">
                            <div className="flex items-center text-gray-200"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#22c55e'}}></span> Sorted / Found</div>
                            <div className="flex items-center text-gray-200"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#f97316'}}></span> Comparing / Active Element</div>
                            <div className="flex items-center text-gray-200"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#9333ea'}}></span> Pivot / Current Minimum</div>
                            <div className="flex items-center text-gray-200"><span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#3b82f6'}}></span> Default</div>
                         </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default App;
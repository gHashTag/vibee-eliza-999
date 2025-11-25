/**
 * Entry point that ensures polyfills are loaded before anything else
 * Use static imports so Vite HMR can properly track the graph.
 */

import './polyfills';
import './index.css';
import('./main');

export {};

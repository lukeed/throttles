type isDone = () => void;
type toAdd = (fn: Function) => void;
declare function throttles(limit?: number): [toAdd, isDone];
export default throttles;

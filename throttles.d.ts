type isDone = () => void;
type toAdd = (fn: Function) => void;
declare function throttles(limit?: number = 1): [toAdd, isDone];
export default throttles;

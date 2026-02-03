import { useEffect, useState } from 'react';

// const useDebounce = <T extends unknown>(
//   value: T,
//   delay: number = 250,
//   maxTime?: number
// ): T => {
//   const [debouncedValue, setDebouncedValue] = useState(value);
//   let lastUpdate: number | null = null;

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//       lastUpdate = Date.now();
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   useEffect(() => {
//     if (!maxTime) return;
//     const handler = setTimeout(() => {
//         setDebouncedValue(value);
//     }, maxTime);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [debouncedValue, maxTime]);

//   return debouncedValue;
// };

// export default useDebounce;

const useDebounce = <T extends unknown>(
  value: T,
  delay: number = 500,
): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};
export default useDebounce;

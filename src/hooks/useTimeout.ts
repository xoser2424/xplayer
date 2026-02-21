import { useEffect, useRef } from "react";

export const useTimeout = (cb: () => void, delay: number, deps: any[] = []) => {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const t = setTimeout(() => cbRef.current(), delay);
    return () => clearTimeout(t);
  }, deps);
};
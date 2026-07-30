import { useState } from "react";
import { storage } from "../lib/storage";

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => storage.get(key, initialValue));
  const update = (next) => {
    setValue((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      storage.set(key, resolved);
      return resolved;
    });
  };
  return [value, update];
}

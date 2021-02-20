export function isDefined(value) {
  return value !== null && value !== undefined;
}

export function toNumber(value, defaults = null) {
  let num = Number.parseFloat(value, 10);
  return Number.isNaN(num) ? defaults : num;
}

export function percentToNumber(str) {
  if (typeof str === "string" && str.indexOf("%") !== -1) {
    return toNumber(str, 0);
  }
  return str;
}

export function pxToPercent(str, size) {
  if (typeof str === "string" && str.indexOf("px") !== -1) {
    return (toNumber(str) * 100) / size;
  }
  return str;
}

export function sum(numArray) {
  if (!Array.isArray(numArray)) return 0;
  return numArray.reduce((sum, num) => sum + num, 0);
}

export function findIndexes(array, predicate) {
  if (!Array.isArray(array)) return [];
  return array.reduce((res, item, index) => {
    if (predicate(item)) {
      res.push(index)
    }
    return res;
  }, []);
}

export function clamp(min, val, max) {
  return Math.max(min, Math.min(val, max));
}

const _curry = (n, f) => {
  const apply = (a) => {
    switch (a.length) {
      case 2:
        return f(a[0], a[1]);
      case 3:
        return f(a[0], a[1], a[2]);
      case 4:
        return f(a[0], a[1], a[2], a[3]);
      case 5:
        return f(a[0], a[1], a[2], a[3], a[4]);
      case 6:
        return f(a[0], a[1], a[2], a[3], a[4], a[5]);
      default:
        return f(...a);
    }
  };
  function c(...a) {
    if (a.length === n)
      return apply(a);
    if (a.length < n)
      return (...b) => c(...a, ...b);
    return a.slice(n).reduce((g, x) => g(x), apply(a.slice(0, n)));
  }
  if (n === 2)
    return (...a) => {
      if (a.length === 2)
        return f(a[0], a[1]);
      if (a.length !== 1)
        return c(...a);
      const x = a[0];
      return (...b) => b.length === 1 ? f(x, b[0]) : c(x, ...b);
    };
  if (n === 3)
    return (...a) => {
      if (a.length === 3)
        return f(a[0], a[1], a[2]);
      if (a.length === 2) {
        const [x, y] = a;
        return (...b) => b.length === 1 ? f(x, y, b[0]) : c(x, y, ...b);
      }
      if (a.length !== 1)
        return c(...a);
      const x = a[0];
      return _curry(2, (y, z) => f(x, y, z));
    };
  return c;
};
const add = _curry(2, (a, b) => a + b);

const answer = add(1, 2);

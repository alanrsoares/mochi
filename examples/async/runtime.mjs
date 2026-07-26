// Domain effects for the async example — a fake remote that sometimes fails.
// Sequencing, recovery and kick-off live in the prelude (`Task.*`, ADR 0005);
// this host only performs the effect. Each export returns a lazy Task
// `() => Promise<Result<a, e>>` (ADR 0006); the `{ _tag: "Ok" | "Err" }` shape
// matches mochi's runtime ctors, so `let!` chains bind straight through.
// Failures are plain strings — main.mochi maps them onto `ApiError` itself.

const Ok = (value) => ({ _tag: "Ok", value });
const Err = (error) => ({ _tag: "Err", error });

const users = new Map([[1, { id: 1, name: "Ada" }]]);

const after = (ms, settle) => () => new Promise((res) => setTimeout(() => res(settle()), ms));

// Id 0 stands in for an unreachable host; any other unknown id is a plain 404.
export const fetchUser = (id) =>
  after(10, () =>
    id === 0 ? Err("network down") : users.has(id) ? Ok(users.get(id)) : Err("404"),
  );

export const fetchPlan = (id) => after(10, () => (users.has(id) ? Ok("pro") : Err("404")));

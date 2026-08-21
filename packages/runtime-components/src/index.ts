/**
 * Runtime composition with owned capability registrations (ADR 0058).
 *
 * This package is deliberately separate from the compiler's static
 * `LanguagePlugin` seam. Its host owns lifecycle order and cleanup for
 * components that appear, disappear, or are replaced while a process runs.
 */
import { err, isErr, ok, type Result, ResultAsync } from "@onrails/result";

declare const capabilityBrand: unique symbol;

/** A typed name for a value that runtime components may provide or require. */
export type Capability<Value> = {
  readonly name: string;
  readonly [capabilityBrand]: Value;
};

/** Make a capability key. Keys are compared by identity, not display name. */
export const capability = <Value>(name: string): Capability<Value> =>
  ({ name }) as Capability<Value>;

export type ProvidedCapability = {
  readonly capability: Capability<unknown>;
  readonly value: unknown;
};

/** A value plus the inverse of all work that installed it. */
export type Resource = {
  readonly provides: readonly ProvidedCapability[];
  readonly dispose: () => ResultAsync<void, ComponentError>;
};

export type ComponentError =
  | { readonly kind: "duplicate-component"; readonly name: string }
  | { readonly kind: "duplicate-provider"; readonly capability: string }
  | {
      readonly kind: "undeclared-provider";
      readonly component: string;
      readonly capability: string;
    }
  | { readonly kind: "missing-provider"; readonly name: string }
  | { readonly kind: "activation-failed"; readonly name: string; readonly cause: unknown }
  | { readonly kind: "disposal-failed"; readonly name: string; readonly cause: unknown };

export type ComponentContext = {
  get: <Value>(key: Capability<Value>) => Value | undefined;
};

/**
 * A dynamically composable runtime unit. `needs` and `provides` form the
 * dependency topology; `activate` returns the inverse for its owned effects.
 */
export type RuntimeComponent = {
  readonly name: string;
  readonly needs?: readonly Capability<unknown>[];
  readonly provides?: readonly Capability<unknown>[];
  readonly activate: (ctx: ComponentContext) => ResultAsync<Resource, unknown>;
};

export type ComponentStatus = "waiting" | "active" | "failed";

export type ComponentSnapshot = {
  readonly name: string;
  readonly status: ComponentStatus;
  readonly missing: readonly string[];
};

type Entry = {
  readonly component: RuntimeComponent;
  readonly order: number;
  status: ComponentStatus;
  resource: Resource | null;
  failure: ComponentError | null;
};

const emptyResource: Resource = {
  provides: [],
  dispose: () => ResultAsync.ok(undefined),
};

const names = (keys: readonly Capability<unknown>[]): readonly string[] =>
  keys.map((key) => key.name);

const includesKey = (keys: readonly Capability<unknown>[], key: Capability<unknown>): boolean =>
  keys.includes(key);

const componentNeeds = (component: RuntimeComponent): readonly Capability<unknown>[] =>
  component.needs ?? [];
const componentProvides = (component: RuntimeComponent): readonly Capability<unknown>[] =>
  component.provides ?? [];

/** A deep module that reconciles a runtime component graph. */
export type ComponentHost = {
  mount: (component: RuntimeComponent) => ResultAsync<void, ComponentError>;
  unmount: (name: string) => ResultAsync<void, ComponentError>;
  replace: (name: string, replacement: RuntimeComponent) => ResultAsync<void, ComponentError>;
  snapshot: () => readonly ComponentSnapshot[];
};

/** Create an isolated runtime-component host. */
export const createComponentHost = (): ComponentHost => {
  const entries = new Map<string, Entry>();
  const providers = new Map<Capability<unknown>, unknown>();
  let nextOrder = 0;

  const context: ComponentContext = {
    get: <Value>(key: Capability<Value>) => providers.get(key) as Value | undefined,
  };

  const missing = (component: RuntimeComponent): readonly Capability<unknown>[] =>
    componentNeeds(component).filter((key) => !providers.has(key));

  const validate = (entry: Entry, resource: Resource): Result<void, ComponentError> => {
    const declared = componentProvides(entry.component);
    for (const provided of resource.provides) {
      if (!includesKey(declared, provided.capability)) {
        return err({
          kind: "undeclared-provider",
          component: entry.component.name,
          capability: provided.capability.name,
        });
      }
      if (providers.has(provided.capability)) {
        return err({ kind: "duplicate-provider", capability: provided.capability.name });
      }
    }
    const absent = declared.find(
      (key) => !resource.provides.some((provided) => provided.capability === key),
    );
    return absent
      ? err({
          kind: "undeclared-provider",
          component: entry.component.name,
          capability: absent.name,
        })
      : ok(undefined);
  };

  const activate = (entry: Entry): ResultAsync<void, ComponentError> =>
    ResultAsync.defer(async () => {
      const activated = await entry.component.activate(context);
      if (isErr(activated)) {
        const failure: ComponentError = {
          kind: "activation-failed",
          name: entry.component.name,
          cause: activated.error,
        };
        entry.status = "failed";
        entry.failure = failure;
        return err(failure);
      }
      const valid = validate(entry, activated.value);
      if (isErr(valid)) {
        const disposed = await activated.value.dispose();
        if (isErr(disposed)) {
          return err({
            kind: "disposal-failed",
            name: entry.component.name,
            cause: disposed.error,
          });
        }
        entry.status = "failed";
        entry.failure = valid.error;
        return valid;
      }
      for (const provided of activated.value.provides)
        providers.set(provided.capability, provided.value);
      entry.resource = activated.value;
      entry.status = "active";
      return ok(undefined);
    });

  const reconcile = (): ResultAsync<void, ComponentError> =>
    ResultAsync.defer(async () => {
      let progressed = true;
      while (progressed) {
        progressed = false;
        for (const entry of entries.values()) {
          if (entry.status !== "waiting" || missing(entry.component).length > 0) continue;
          const activated = await activate(entry);
          if (isErr(activated)) return activated;
          progressed = true;
        }
      }
      return ok(undefined);
    });

  const dependentsOf = (name: string): readonly Entry[] => {
    const selected = new Set<string>([name]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const [candidateName, entry] of entries) {
        if (selected.has(candidateName) || entry.status !== "active") continue;
        const supplied = [...selected].flatMap(
          (selectedName) => entries.get(selectedName)?.resource?.provides ?? [],
        );
        if (
          componentNeeds(entry.component).some((need) =>
            supplied.some((provided) => provided.capability === need),
          )
        ) {
          selected.add(candidateName);
          changed = true;
        }
      }
    }
    return [...selected]
      .map((selectedName) => entries.get(selectedName))
      .filter((entry): entry is Entry => entry !== undefined)
      .sort((a, b) => b.order - a.order);
  };

  const deactivate = (entry: Entry): ResultAsync<void, ComponentError> =>
    ResultAsync.defer(async () => {
      if (entry.status !== "active" || !entry.resource) return ok(undefined);
      const disposed = await entry.resource.dispose();
      if (isErr(disposed)) {
        return err({ kind: "disposal-failed", name: entry.component.name, cause: disposed.error });
      }
      for (const provided of entry.resource.provides) providers.delete(provided.capability);
      entry.resource = null;
      entry.status = "waiting";
      return ok(undefined);
    });

  const mount = (component: RuntimeComponent): ResultAsync<void, ComponentError> =>
    ResultAsync.defer(async () => {
      if (entries.has(component.name))
        return err({ kind: "duplicate-component", name: component.name });
      entries.set(component.name, {
        component,
        order: nextOrder++,
        status: "waiting",
        resource: null,
        failure: null,
      });
      return reconcile();
    });

  const unmount = (name: string): ResultAsync<void, ComponentError> =>
    ResultAsync.defer(async () => {
      const entry = entries.get(name);
      if (!entry) return err({ kind: "missing-provider", name });
      for (const dependent of dependentsOf(name)) {
        const disposed = await deactivate(dependent);
        if (isErr(disposed)) return disposed;
      }
      entries.delete(name);
      return reconcile();
    });

  const replace = (
    name: string,
    replacement: RuntimeComponent,
  ): ResultAsync<void, ComponentError> =>
    ResultAsync.defer(async () => {
      const previous = entries.get(name)?.component;
      if (!previous) return err({ kind: "missing-provider", name });
      const removed = await unmount(name);
      if (isErr(removed)) return removed;
      const installed = await mount(replacement);
      if (!isErr(installed)) return installed;
      entries.delete(replacement.name);
      const restored = await mount(previous);
      return isErr(restored) ? restored : installed;
    });

  const snapshot = (): readonly ComponentSnapshot[] =>
    [...entries.values()].map((entry) => ({
      name: entry.component.name,
      status: entry.status,
      missing: names(missing(entry.component)),
    }));

  return { mount, unmount, replace, snapshot };
};

/** A no-op resource for components that only consume capabilities. */
export const resource = (provides: readonly ProvidedCapability[] = []): Resource => ({
  provides,
  dispose: emptyResource.dispose,
});

/** Couple a typed capability key to its provision value. */
export const provide = <Value>(
  capability: Capability<Value>,
  value: Value,
): ProvidedCapability => ({
  capability,
  value,
});

import { describe, expect, test } from "bun:test";
import { err, isErr, ResultAsync } from "@onrails/result";
import { capability, createComponentHost, provide, type RuntimeComponent, resource } from "./index";

const db = capability<{ readonly query: () => string }>("db");
const server = capability<{ readonly start: () => string }>("server");
const unclaimed = capability<string>("unclaimed");

type ComponentOptions = Omit<RuntimeComponent, "name" | "activate"> & {
  readonly activate?: RuntimeComponent["activate"];
};

const component = (name: string, opts: ComponentOptions = {}): RuntimeComponent => ({
  name,
  ...opts,
  activate: opts.activate ?? (() => ResultAsync.ok(resource())),
});

describe("runtime components", () => {
  test("waits for needs and activates when a provider arrives", async () => {
    const host = createComponentHost();
    const consumer = component("consumer", {
      needs: [db],
      activate: (ctx) =>
        ctx.get(db)?.query() === "ok" ? ResultAsync.ok(resource()) : ResultAsync.err("missing db"),
    });
    const provider = component("provider", {
      provides: [db],
      activate: () => ResultAsync.ok(resource([provide(db, { query: () => "ok" })])),
    });

    expect(isErr(await host.mount(consumer))).toBeFalse();
    expect(host.snapshot()).toEqual([{ name: "consumer", status: "waiting", missing: ["db"] }]);
    expect(isErr(await host.mount(provider))).toBeFalse();
    expect(host.snapshot().map((entry) => [entry.name, entry.status])).toEqual([
      ["consumer", "active"],
      ["provider", "active"],
    ]);
  });

  test("deactivates dependents before disposing their provider", async () => {
    const host = createComponentHost();
    const events: string[] = [];
    const provider = component("provider", {
      provides: [db],
      activate: () =>
        ResultAsync.ok({
          provides: [provide(db, { query: () => "ok" })],
          dispose: () => {
            events.push("provider");
            return ResultAsync.ok(undefined);
          },
        }),
    });
    const consumer = component("consumer", {
      needs: [db],
      provides: [server],
      activate: () =>
        ResultAsync.ok({
          provides: [provide(server, { start: () => "started" })],
          dispose: () => {
            events.push("consumer");
            return ResultAsync.ok(undefined);
          },
        }),
    });

    await host.mount(provider);
    await host.mount(consumer);
    expect(isErr(await host.unmount("provider"))).toBeFalse();
    expect(events).toEqual(["consumer", "provider"]);
    expect(host.snapshot()).toEqual([{ name: "consumer", status: "waiting", missing: ["db"] }]);
  });

  test("restores the previous provider when a replacement fails", async () => {
    const host = createComponentHost();
    const provider = component("provider", {
      provides: [db],
      activate: () => ResultAsync.ok(resource([provide(db, { query: () => "old" })])),
    });
    const consumer = component("consumer", {
      needs: [db],
      activate: (ctx) =>
        ctx.get(db)?.query() === "old"
          ? ResultAsync.ok(resource())
          : ResultAsync.err("wrong provider"),
    });
    const broken = component("provider", {
      provides: [db],
      activate: () => ResultAsync.fromResult(err("boom")),
    });

    await host.mount(provider);
    await host.mount(consumer);
    const replaced = await host.replace("provider", broken);
    expect(isErr(replaced)).toBeTrue();
    expect(host.snapshot().map((entry) => [entry.name, entry.status])).toEqual([
      ["consumer", "active"],
      ["provider", "active"],
    ]);
  });

  test("disposes a resource when its provision declaration is invalid", async () => {
    const host = createComponentHost();
    let disposed = false;
    const invalid = component("invalid", {
      activate: () =>
        ResultAsync.ok({
          provides: [provide(unclaimed, "value")],
          dispose: () => {
            disposed = true;
            return ResultAsync.ok(undefined);
          },
        }),
    });

    expect(isErr(await host.mount(invalid))).toBeTrue();
    expect(disposed).toBeTrue();
  });
});

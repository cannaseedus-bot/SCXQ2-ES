/**
 * MATRIX VM v0.1
 * Deterministic block runner:
 * - No ambient IO
 * - All effects go through plugins
 * - Produces (reply, emits)
 */
export function runProgramWithPlugins({ programNorm, policyNorm, inputEvent, plugins }) {
  const ctx = {
    inputEvent,
    last: null,
    reply: null,
    emits: []
  };

  const idb = plugins.idb;

  for (const b of programNorm.program.blocks) {
    switch (b.op) {
      case "idb.query": {
        if (!policyNorm.allow_idb) throw new Error("IDB_DISABLED");
        ctx.last = idb.query(b.args.store, b.args.kql);
        break;
      }
      case "idb.get": {
        if (!policyNorm.allow_idb) throw new Error("IDB_DISABLED");
        ctx.last = idb.get(b.args.store, b.args.key);
        break;
      }
      case "idb.put": {
        if (!policyNorm.allow_idb) throw new Error("IDB_DISABLED");
        ctx.last = idb.put(b.args.store, b.args.value);
        break;
      }
      case "event.reply": {
        const ev = b.args.event;
        if (!ev) throw new Error("event.reply missing args.event");
        const body = b.args.body_from === "last" ? ctx.last : (b.args.body ?? {});
        ctx.reply = { event: ev, v: 1, input: body };
        break;
      }
      case "event.emit": {
        const ev = b.args.event;
        const body = b.args.body_from === "last" ? ctx.last : (b.args.body ?? {});
        ctx.emits.push({ event: ev, v: 1, input: body });
        break;
      }
      default:
        throw new Error(`UNSUPPORTED_OP '${b.op}'`);
    }
  }

  return { reply: ctx.reply, emits: ctx.emits };
}
